import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { createCheckoutSession, resendVerificationEmail, cancelSubscription, verifyCheckoutSession, fetchLiveSubscription } from '../services/api';

const Account: React.FC = () => {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { user, logout, isAuthenticated, refreshProfile } = useAuth();

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [resendingVerification, setResendingVerification] = useState(false);
    const [canceling, setCanceling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [subscriptionDetails, setSubscriptionDetails] = useState<{ cancelAtPeriodEnd?: boolean; nextBillDate?: string } | null>(null);

    useEffect(() => {
        const status = params.get('status');
        const sessionId = params.get('session_id');
        if (status === 'cancel') setMessage('Checkout was canceled.');
        if (status === 'success' && sessionId) {
            (async () => {
                try {
                    setMessage('Finalizing subscription...');
                    await verifyCheckoutSession(sessionId);
                    await refreshProfile();
                    // Fetch updated subscription details
                    try {
                        const subscriptionData = await fetchLiveSubscription();
                        setSubscriptionDetails(subscriptionData);
                    } catch (e) {
                        // silent fail
                    }
                    setMessage('Subscription updated successfully.');
                } catch (e: any) {
                    setError(e?.response?.data?.error || e?.message || 'Failed to verify subscription');
                }
            })();
        }
    }, [params, refreshProfile]);

    useEffect(() => {
        if (isAuthenticated) {
            (async () => {
                await refreshProfile();
                // After profile, force live sync to Stripe to ensure correctness
                try {
                    const subscriptionData = await fetchLiveSubscription();
                    setSubscriptionDetails(subscriptionData);
                    await refreshProfile();
                } catch (e) {
                    // silent fail; user still sees last known status
                }
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleResendVerification = async () => {
        if (!user?.email) return;
        
        setResendingVerification(true);
        setError(null);
        setMessage(null);
        
        try {
            await resendVerificationEmail(user.email);
            setMessage('Verification email sent! Please check your inbox.');
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to send verification email');
        } finally {
            setResendingVerification(false);
        }
    };

    const handleSubscribe = useCallback(async () => {
        if (!user?._id) return setError('Please log in first.');
        setLoading(true);
        setError(null);
        try {
            const { url } = await createCheckoutSession({ userId: user._id });
            window.location.href = url;
        } catch (e: any) {
            setError(e?.response?.data?.error || e?.message || 'Failed to start checkout');
        } finally {
            setLoading(false);
        }
    }, [user]);

    const handleCancel = () => {
        setShowCancelConfirm(true);
    };

    const handleConfirmCancel = useCallback(async () => {
        setShowCancelConfirm(false);
        setCanceling(true);
        setError(null);
        setMessage(null);
        try {
            const res = await cancelSubscription();
            setMessage(res.message || 'Subscription will cancel at period end.');
            // Update subscription details with the cancel status
            setSubscriptionDetails({
                cancelAtPeriodEnd: res.cancelAtPeriodEnd,
                nextBillDate: res.nextBillDate
            });
            if (isAuthenticated) await refreshProfile();
        } catch (e: any) {
            setError(e?.response?.data?.error || e?.message || 'Failed to cancel subscription');
        } finally {
            setCanceling(false);
        }
    }, [isAuthenticated, refreshProfile]);

    if (!isAuthenticated) {
        return (
            <div className="card auth-card">
                <h1 className="page-title">Account</h1>
                <p>Please log in to manage your subscription.</p>
                <div className="form-actions">
                    <button className="btn" onClick={() => navigate('/login')}>Login</button>
                </div>
            </div>
        );
    }

    return (
        <div className="card content-narrow">
            <h1 className="page-title">Account</h1>
            {message && <p className="alert alert-success">{message}</p>}
            {error && <p className="alert alert-danger">{error}</p>}

            {user ? (
                <div>
                    <h2>Welcome, {user.username || user.name || 'User'}!</h2>
                    <p className="mt-2">Email: {user.email}</p>
                    
                    {/* Email verification status */}
                    <div className="mt-2">
                        {user.emailVerified ? (
                            <p className="alert alert-success">✅ Email verified</p>
                        ) : (
                            <div>
                                <p className="alert alert-warning">⚠️ Email not verified</p>
                                <p>Please verify your email address to access all features.</p>
                                <div className="form-actions">
                                    <button 
                                        className="btn-outline" 
                                        onClick={handleResendVerification}
                                        disabled={resendingVerification}
                                    >
                                        {resendingVerification ? 'Sending...' : 'Resend Verification Email'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <p className="mt-2">Subscription: {user.subscriptionActive ? (subscriptionDetails?.cancelAtPeriodEnd ? 'Canceled (Active until period end)' : 'Active') : 'Inactive'}</p>
                    {/* Next bill date display (alias of subscriptionCurrentPeriodEnd coming from server as nextBillDate) */}
                    {user.subscriptionCurrentPeriodEnd && !subscriptionDetails?.cancelAtPeriodEnd && (
                        <p className="mt-2">Next bill date: {new Date(user.subscriptionCurrentPeriodEnd).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    )}
                    {subscriptionDetails?.cancelAtPeriodEnd && user.subscriptionCurrentPeriodEnd && (
                        <p className="mt-2">Access until: {new Date(user.subscriptionCurrentPeriodEnd).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    )}

                    {!user.subscriptionActive && (
                        <div className="form-actions">
                            <button className="btn" disabled={loading} onClick={handleSubscribe}>
                                {loading ? 'Redirecting…' : 'Subscribe'}
                            </button>
                        </div>
                    )}
                    {user.subscriptionActive && (
                        <div className="form-actions">
                            {!subscriptionDetails?.cancelAtPeriodEnd && (
                                <button className="btn" disabled={canceling} onClick={handleCancel}>
                                    {canceling ? 'Canceling…' : 'Cancel subscription'}
                                </button>
                            )}
                        </div>
                    )}
                    <div className="form-actions">
                        <button className="btn-outline" onClick={handleLogout}>Logout</button>
                    </div>
                </div>
            ) : (
                <div>
                    <h2>Loading profile…</h2>
                </div>
            )}
            
            {/* Cancel Confirmation Dialog */}
            {showCancelConfirm && (
                <div 
                    className="modal-overlay" 
                    onClick={() => setShowCancelConfirm(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                >
                    <div 
                        className="modal-content" 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: 'white',
                            padding: '24px',
                            borderRadius: '8px',
                            maxWidth: '400px',
                            width: '90%',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                        }}
                    >
                        <h3 style={{ margin: '0 0 16px', fontSize: '1.25rem' }}>Cancel Subscription</h3>
                        <p style={{ margin: '0 0 24px', lineHeight: '1.5', color: '#666' }}>
                            Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.
                        </p>
                        <div className="modal-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button 
                                className="btn-outline" 
                                onClick={() => setShowCancelConfirm(false)}
                                disabled={canceling}
                            >
                                Keep Subscription
                            </button>
                            <button 
                                className="btn" 
                                onClick={handleConfirmCancel}
                                disabled={canceling}
                            >
                                {canceling ? 'Canceling…' : 'Yes, Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Account;