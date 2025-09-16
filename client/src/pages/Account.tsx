import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { createBillingPortalSession, createCheckoutSession, resendVerificationEmail } from '../services/api';

const Account: React.FC = () => {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { user, logout, isAuthenticated, refreshProfile } = useAuth();

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [resendingVerification, setResendingVerification] = useState(false);

    useEffect(() => {
        const status = params.get('status');
        if (status === 'success') setMessage('Subscription updated successfully.');
        if (status === 'cancel') setMessage('Checkout was canceled.');
    }, [params]);

    useEffect(() => {
        if (isAuthenticated) refreshProfile();
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

    const handleManage = useCallback(async () => {
        if (!user?.stripeCustomerId) return setError('No active subscription to manage.');
        setLoading(true);
        setError(null);
        try {
            const { url } = await createBillingPortalSession({ customerId: user.stripeCustomerId });
            window.location.href = url;
        } catch (e: any) {
            setError(e?.response?.data?.error || e?.message || 'Failed to open billing portal');
        } finally {
            setLoading(false);
        }
    }, [user?.stripeCustomerId]);

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
        <div className="card">
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
                    
                    <p className="mt-2">Subscription: {user.subscriptionActive ? 'Active' : 'Inactive'}</p>
                    {user.subscriptionCurrentPeriodEnd && (
                        <p className="mt-2">Current period end: {new Date(user.subscriptionCurrentPeriodEnd).toLocaleString()}</p>
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
                            <button className="btn-outline" disabled={loading} onClick={handleManage}>
                                {loading ? 'Opening…' : 'Manage subscription'}
                            </button>
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
        </div>
    );
};

export default Account;