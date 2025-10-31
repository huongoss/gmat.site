import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NOVEMBER_PROMO, isPromoActive } from '../constants/promo';
import { trackEvent } from '../utils/analytics';

const PromoBanner: React.FC = () => {
  const promo = NOVEMBER_PROMO;
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    const k = localStorage.getItem('promo_dismiss_nov90');
    return k === '1';
  });

  if (dismissed || !isPromoActive(promo)) return null;

  const onCopy = () => {
    navigator.clipboard.writeText(promo.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      trackEvent('promo_copy', { code: promo.code });
    });
  };

  const onSubscribe = () => {
    trackEvent('promo_subscribe_click', { code: promo.code });
    navigate(`/pricing?promo=${encodeURIComponent(promo.code)}`);
  };

  const onDismiss = () => {
    setDismissed(true);
    localStorage.setItem('promo_dismiss_nov90', '1');
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
          <button className="promo-btn" onClick={onCopy} aria-label="Copy promotion code">
            {copied ? 'Copied!' : (promo.ctaLabel || 'Copy Code')}
          </button>
          <button className="promo-btn" style={{ background:'#333', border:'1px solid #555' }} onClick={onSubscribe} aria-label="Go to pricing with promo">
            Subscribe
          </button>
          <button className="promo-dismiss" onClick={onDismiss} aria-label="Dismiss promotion">×</button>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;
