import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { createCheckoutSession, createBillingPortalSession, getPricing } from '../services/api';
import './Pricing.css';

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
    const { url } = await createBillingPortalSession({ returnUrl: window.location.origin + '/account' });
    window.location.href = url;
  };

  const formatted = price
    ? new Intl.NumberFormat(undefined, { style: 'currency', currency: price.currency.toUpperCase() }).format((price.amount || 0) / 100)
    : null;

  return (
  <div className="card content-narrow pricing-page">
      <h1 className="page-title">Choose your plan</h1>
      <p className="mt-2">Practice smarter with curated daily questions. Upgrade anytime.</p>

  <div className="pricing-grid centered-grid">
        <div className="card pricing-plan pricing-plan--free">
          <h2 className="pricing-plan__title">Free</h2>
          <p className="muted pricing-plan__subtitle">Great to get started</p>
          <h3 className="pricing-plan__price">$0</h3>
          <ul className="pricing-plan__features">
            <li>2 new questions every 2 days</li>
            <li>Curated practice set</li>
            <li>Basic progress (session only)</li>
          </ul>
          <div className="pricing-plan__actions">
            <button className="btn-outline" onClick={() => navigate('/daily')}>Start daily practice</button>
          </div>
        </div>

        <div className="card pricing-plan pricing-plan--pro">
          <h2 className="pricing-plan__title pricing-plan__title--pro">Monthly <span className="pricing-badge pricing-badge--float">Recommended</span></h2>
          <p className="muted pricing-plan__subtitle">For consistent improvement</p>
          <h3 className="pricing-plan__price">
            {priceLoading ? 'Loading…' : priceError ? '—' : `${formatted} / ${price?.interval || 'month'}`}
          </h3>
          {priceError && <p className="alert alert-danger mt-2">{priceError}</p>}
          <ul className="pricing-plan__features">
            <li>10 new questions every day</li>
            <li>Structured sequence with progress saved</li>
            <li>Access to full practice features</li>
            <li>Priority support</li>
            <li>Cancel anytime</li>
          </ul>
          <div className="pricing-plan__actions">
            {!user?.subscriptionActive ? (
              <button className="btn-accent" onClick={handleSubscribe} disabled={priceLoading || !!priceError}>
                {priceLoading ? 'Preparing…' : 'Upgrade to Monthly'}
              </button>
            ) : (
              <>
                <button className="btn-accent" onClick={() => navigate('/daily')}>Continue practice</button>
                <button className="btn-outline manage-btn" onClick={handleManage}>Manage subscription</button>
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
