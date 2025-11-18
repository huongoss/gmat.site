import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NOVEMBER_PROMO, isPromoActive } from '../constants/promo';
import { trackEvent } from '../utils/analytics';
import useAuth from '../hooks/useAuth';
import { createCheckoutSession } from '../services/api';

const PromoBanner: React.FC = () => {
  const promo = NOVEMBER_PROMO;
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  // Session-only dismiss; do not persist to localStorage
  const [dismissed, setDismissed] = useState<boolean>(false);

  // Hooks must be called unconditionally on every render; declare all hooks before any early returns.
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (dismissed || !isPromoActive(promo)) return null;

  const startDirectCheckout = async () => {
    // If authenticated, create checkout session immediately
    if (isAuthenticated && user?._id) {
      try {
        setLoading(true);
        const { url } = await createCheckoutSession({ userId: user._id, promoCode: promo.code });
        trackEvent('promo_direct_checkout', { code: promo.code });
        window.location.href = url;
      } catch (e: any) {
        console.warn('Direct checkout failed; falling back to pricing', e?.message || e);
        navigate(`/pricing?promo=${encodeURIComponent(promo.code)}`);
      } finally {
        setLoading(false);
      }
    } else {
      // Not authenticated: send to login then pricing with promo
      navigate(`/login?next=${encodeURIComponent('/pricing?promo=' + promo.code)}`);
    }
  };

  const onCopyAndSubscribe = () => {
    navigator.clipboard.writeText(promo.code).then(() => {
      setCopied(true);
      trackEvent('promo_copy', { code: promo.code });
      trackEvent('promo_copy_subscribe_auto', { code: promo.code });
      // Immediately start checkout flow
      startDirectCheckout();
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Even if copy fails, still proceed to checkout for minimal friction
      startDirectCheckout();
    });
  };

  // Legacy subscribe button removed in favor of combined copy+subscribe action

  const onDismiss = () => {
    setDismissed(true);
    trackEvent('promo_dismiss', { code: promo.code });
  };

  return (
    <div className="promo-banner" role="note" aria-label="Promotion">
      <div className="promo-inner" style={{ borderColor: promo.highlightColor }}>
        <div className="promo-text">
          <strong className="promo-heading" style={{ color: promo.highlightColor }}>{promo.heading}</strong>
          <span className="promo-sub">{promo.subheading}</span>
        </div>
        <div className="promo-actions">
          <button className="promo-btn" onClick={onCopyAndSubscribe} aria-label="Copy code and subscribe now" disabled={loading}>
            {loading ? 'Redirecting…' : (copied ? 'Copied! Redirecting…' : (promo.ctaLabel || 'Copy Code & Subscribe'))}
          </button>
          <button className="promo-dismiss" onClick={onDismiss} aria-label="Dismiss promotion">×</button>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;
