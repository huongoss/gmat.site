import React, { useEffect, useState } from 'react';
import { getRecaptchaToken } from '../utils/recaptcha';

/**
 * HumanCheck: A lightweight visible indicator so users know a security / bot protection check is active.
 * It attempts to pre-fetch a reCAPTCHA v3 token on mount (non-blocking). This is purely reassurance UI.
 * Props:
 *  - action: optional recaptcha action label (default: 'precheck')
 *  - showLegal: if true, renders the required reCAPTCHA legal notice
 */
const HumanCheck: React.FC<{ action?: string; showLegal?: boolean }> = ({ action = 'precheck', showLegal = false }) => {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await getRecaptchaToken(action);
        if (!mounted) return;
        setStatus('ok');
      } catch (_) {
        if (!mounted) return;
        setStatus('error');
      }
    })();
    return () => { mounted = false; };
  }, [action]);

  const label = status === 'ok' ? 'Verified' : status === 'error' ? 'Unavailable' : 'Checking…';
  const symbol = status === 'ok' ? '✓' : status === 'error' ? '!' : '…';

  return (
    <div className="human-check" aria-live="polite">
      <span className={`hc-indicator ${status}`}>{symbol}</span>
      <span className="hc-text">Security check: {label}</span>
      {showLegal && (
        <div className="hc-legal">
          <small>
            This site is protected by reCAPTCHA and the Google{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>{' '}and{' '}
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> apply.
          </small>
        </div>
      )}
    </div>
  );
};

export default HumanCheck;
