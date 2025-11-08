import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { createCheckoutSession, resendVerificationEmail, cancelSubscription, verifyCheckoutSession, fetchLiveSubscription, updateName } from '../services/api';

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
    const [showPostSignupVerify, setShowPostSignupVerify] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const hasLoadedSubscription = useRef(false);

    // Name editing state
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [savingName, setSavingName] = useState(false);

    useEffect(() => {
        // If user just verified from VerifyEmail page, ensure profile refresh on arrival
        const jv = localStorage.getItem('justVerifiedEmail');
        if (isAuthenticated && jv) {
            (async () => {
                try { await refreshProfile(); } catch {}
                try { localStorage.removeItem('justVerifiedEmail'); } catch {}
            })();
        }

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params]);

    useEffect(() => {
        if (isAuthenticated && !hasLoadedSubscription.current) {
            hasLoadedSubscription.current = true;
            (async () => {
                // After profile, force live sync to Stripe to ensure correctness
                try {
                    const subscriptionData = await fetchLiveSubscription();
                    setSubscriptionDetails(subscriptionData);
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

    useEffect(() => {
        // Show verification prompt whenever user is logged in and not verified
        if (isAuthenticated && user && user.email && !user.emailVerified) {
            setShowPostSignupVerify(true);
        }
    }, [isAuthenticated, user]);

    const handleModalResend = async () => {
        if (!user?.email) return;
        setResendLoading(true);
        try {
            const mod = await import('../services/api');
            await mod.resendVerificationEmail(user.email);
            alert('Verification email resent. Check your inbox (and spam).');
        } catch (e: any) {
            alert(e?.response?.data?.message || e?.message || 'Failed to resend.');
        } finally {
            setResendLoading(false);
        }
    };

    const handleEditUsername = () => {
        setEditedName(user?.name || '');
        setIsEditingName(true);
        setError(null);
        setMessage(null);
    };

    const handleCancelEditUsername = () => {
        setIsEditingName(false);
        setEditedName('');
    };

    const handleSaveUsername = async () => {
        if (!editedName.trim()) {
            setError('Name cannot be empty');
            return;
        }

        setSavingName(true);
        setError(null);
        setMessage(null);

        try {
            await updateName(editedName.trim());
            await refreshProfile();
            setMessage('Name updated successfully!');
            setIsEditingName(false);
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || 'Failed to update name');
        } finally {
            setSavingName(false);
        }
    };

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
                    {/* Name with edit functionality */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        {!isEditingName ? (
                            <>
                                <h2 style={{ margin: 0 }}>Welcome, {user.name || user.username || 'there'}!</h2>
                                <button
                                    onClick={handleEditUsername}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '1.2rem',
                                        padding: '4px 8px',
                                        color: '#666',
                                        transition: 'color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#333'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
                                    title="Edit name"
                                    aria-label="Edit name"
                                >
                                    ✏️
                                </button>
                            </>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    placeholder="Enter your name"
                                    style={{
                                        padding: '8px 12px',
                                        fontSize: '1rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                        minWidth: '200px'
                                    }}
                                    disabled={savingName}
                                    autoFocus
                                />
                                <button
                                    className="btn"
                                    onClick={handleSaveUsername}
                                    disabled={savingName || !editedName.trim()}
                                    style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                                >
                                    {savingName ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    className="btn-outline"
                                    onClick={handleCancelEditUsername}
                                    disabled={savingName}
                                    style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
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
                    {user.subscriptionActive && user.subscriptionCurrentPeriodEnd && !subscriptionDetails?.cancelAtPeriodEnd && new Date(user.subscriptionCurrentPeriodEnd).getFullYear() > 1970 && (
                        <p className="mt-2">Next bill date: {new Date(user.subscriptionCurrentPeriodEnd).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    )}
                    {user.subscriptionActive && subscriptionDetails?.cancelAtPeriodEnd && user.subscriptionCurrentPeriodEnd && new Date(user.subscriptionCurrentPeriodEnd).getFullYear() > 1970 && (
                        <p className="mt-2">Access until: {new Date(user.subscriptionCurrentPeriodEnd).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    )}

                    {/* Start Practicing Button */}
                    <div className="form-actions">
                        <button 
                            className="btn-accent" 
                            onClick={() => navigate('/daily')}
                        >
                            🚀 Start Practicing
                        </button>
                    </div>

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
                        {/* Post-signup verification guidance modal */}
                        {showPostSignupVerify && user && !user.emailVerified && (
                                <div
                                    role="dialog"
                                    aria-modal="true"
                                    aria-labelledby="verify-guide-title"
                                    className="modal-overlay"
                                    onClick={() => setShowPostSignupVerify(false)}
                                    style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1400 }}
                                >
                                    <div
                                        className="modal-content"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ background:'#fff', padding:'24px', borderRadius:12, width:'90%', maxWidth:460, boxShadow:'0 6px 24px rgba(0,0,0,.18)', position:'relative' }}
                                    >
                                        <h3 id="verify-guide-title" style={{ margin:'0 0 12px', fontSize:'1.3rem' }}>Verify your email</h3>
                                        <p style={{ margin:'0 0 12px', fontSize:'.95rem', lineHeight:'1.45' }}>We sent a verification link to <strong>{user.email}</strong>. Please open your inbox and click the link to activate full access.</p>
                                        <p style={{ margin:'0 0 16px', fontSize:'.8rem', color:'#64748b' }}>Tip: Check Promotions/Spam if it doesn't appear within a minute.</p>
                                        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                                            <button className="btn-accent" style={{ flex:'1 1 auto', justifyContent:'center' }} onClick={handleModalResend} disabled={resendLoading}>{resendLoading ? 'Resending…' : 'Resend Email'}</button>
                                            <button className="btn-outline" style={{ flex:'1 1 auto' }} onClick={() => setShowPostSignupVerify(false)}>Dismiss</button>
                                        </div>
                                        <button aria-label="Close" onClick={() => setShowPostSignupVerify(false)} style={{ position:'absolute', top:8, right:8, background:'transparent', border:'none', fontSize:'1.2rem', cursor:'pointer', color:'#64748b' }}>×</button>
                                    </div>
                                </div>
                        )}
        </div>
    );
};

export default Account;