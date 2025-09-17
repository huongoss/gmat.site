import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { createCheckoutSession, createBillingPortalSession, getPricing } from '../services/api';

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [priceLoading, setPriceLoading] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [price, setPrice] = useState<{ amount: number; currency: string; interval: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setPriceLoading(true);
        const p = await getPricing();
        setPrice({ amount: p.amount, currency: p.currency, interval: p.interval });
      } catch (e: any) {
        setPriceError(e?.response?.data?.error || e?.message || 'Failed to load pricing');
      } finally {
        setPriceLoading(false);
      }
    })();
  }, []);

  const handleSubscribe = async () => {
    if (!isAuthenticated || !user?._id) return navigate('/login');
    const { url } = await createCheckoutSession({ userId: user._id });
    window.location.href = url;
  };

  const handleManage = async () => {
    if (!isAuthenticated || !user?.stripeCustomerId) return navigate('/account');
    const { url } = await createBillingPortalSession({ customerId: user.stripeCustomerId });
    window.location.href = url;
  };

  const formatted = price
    ? new Intl.NumberFormat(undefined, { style: 'currency', currency: price.currency.toUpperCase() }).format((price.amount || 0) / 100)
    : null;

  return (
    <div className="card">
      <h1 className="page-title">Choose your plan</h1>
      <p className="mt-2">Practice smarter with curated daily questions. Upgrade anytime.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
        <div className="card" style={{ border: '1px solid #e5e7eb' }}>
          <h2>Free</h2>
          <p className="muted">Great to get started</p>
          <h3 style={{ marginTop: 12 }}>$0</h3>
          <ul className="mt-2">
            <li>2 new questions every 2 days</li>
            <li>Curated practice set</li>
            <li>Basic progress (session only)</li>
          </ul>
          <div className="form-actions" style={{ marginTop: 16 }}>
            <button className="btn-outline" onClick={() => navigate('/daily')}>Start daily practice</button>
          </div>
        </div>

        <div className="card" style={{ border: '2px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Monthly</h2>
            <span className="badge">Recommended</span>
          </div>
          <p className="muted">For consistent improvement</p>
          <h3 style={{ marginTop: 12 }}>
            {priceLoading ? 'Loading…' : priceError ? '—' : `${formatted} / ${price?.interval || 'month'}`}
          </h3>
          {priceError && <p className="alert alert-danger mt-2">{priceError}</p>}
          <ul className="mt-2">
            <li>10 new questions every day</li>
            <li>Structured sequence with progress saved</li>
            <li>Access to full practice features</li>
            <li>Priority support</li>
            <li>Cancel anytime</li>
          </ul>
          <div className="form-actions" style={{ marginTop: 16 }}>
            {!user?.subscriptionActive ? (
              <button className="btn" onClick={handleSubscribe} disabled={priceLoading || !!priceError}>
                {priceLoading ? 'Preparing…' : 'Upgrade to Monthly'}
              </button>
            ) : (
              <>
                <button className="btn" onClick={() => navigate('/daily')}>Continue practice</button>
                <button className="btn-outline" style={{ marginLeft: 8 }} onClick={handleManage}>Manage subscription</button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="muted">No hidden fees. You can cancel your subscription anytime from your account.</p>
      </div>
    </div>
  );
};

export default Pricing;
