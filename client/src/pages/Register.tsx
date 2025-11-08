import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getRecaptchaToken } from '../utils/recaptcha';
import HumanCheck from '../components/HumanCheck';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showVerifyPrompt, setShowVerifyPrompt] = useState(false);

  const emailDomain = useMemo(() => (email.includes('@') ? email.split('@')[1].toLowerCase() : ''), [email]);
  const provider = useMemo(() => {
    const d = emailDomain;
    if (!d) return null;
    if (d === 'gmail.com') return { name: 'Gmail', url: 'https://mail.google.com/' };
    if (d === 'outlook.com' || d === 'hotmail.com' || d === 'live.com' || d.endsWith('.outlook.com')) return { name: 'Outlook', url: 'https://outlook.live.com/mail/' };
    if (d === 'yahoo.com' || d === 'ymail.com') return { name: 'Yahoo Mail', url: 'https://mail.yahoo.com/' };
    if (d === 'icloud.com' || d === 'me.com' || d === 'mac.com') return { name: 'iCloud Mail', url: 'https://www.icloud.com/mail/' };
    if (d === 'proton.me' || d === 'protonmail.com') return { name: 'Proton Mail', url: 'https://mail.proton.me/u/0/inbox' };
    if (d.endsWith('zoho.com')) return { name: 'Zoho Mail', url: 'https://mail.zoho.com' };
    if (d === 'aol.com') return { name: 'AOL Mail', url: 'https://mail.aol.com' };
    if (d === 'gmx.com' || d === 'gmx.net') return { name: 'GMX Mail', url: 'https://www.gmx.com/' };
    return null;
  }, [emailDomain]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      let recaptchaToken: string | undefined;
      try { recaptchaToken = await getRecaptchaToken('register'); } catch (e) { /* ignore token errors in dev */ }
  await register(email, password, username || undefined, recaptchaToken);
    setSuccess('✅ Account created! Check your email to verify and unlock your first adaptive quiz.');
    // Show verify prompt immediately
    setShowVerifyPrompt(true);
      // Hold user here; allow resend & explore limited practice.
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };
// import already at top

  useEffect(() => {
    if (success) {
      // Show universal verify prompt modal after success
      const t = setTimeout(() => setShowVerifyPrompt(true), 150);
      return () => clearTimeout(t);
    }
  }, [success, email]);

  return (
    <div className="card auth-card">
      <h2>Register</h2>
      {error && <p className="alert alert-danger">{error}</p>}
      {success && (
        <div>
          <p className="alert alert-success">{success}</p>
          <p style={{ fontSize: '.9rem' }}>Didn’t get the email? You can resend or start exploring free practice (verification required to save progress).</p>
          <div className="form-actions" style={{ marginTop: 16 }}>
            <button
              type="button"
              className="btn-outline"
              disabled={resendLoading}
              onClick={async () => {
                if (!email) return;
                setResendLoading(true);
                try {
                  // Lazy import to avoid top-level change if resendVerificationEmail already exists
                  const mod = await import('../services/api');
                  await mod.resendVerificationEmail(email);
                  alert('Verification email resent. Check your inbox (and spam).');
                } catch (e: any) {
                  alert(e?.response?.data?.message || e?.message || 'Failed to resend.');
                } finally {
                  setResendLoading(false);
                }
              }}
            >{resendLoading ? 'Resending…' : 'Resend Email'}</button>
            <button
              type="button"
              className="btn"
              style={{ marginLeft: 8 }}
              onClick={() => navigate('/daily?intro=1')}
            >Try Intro Practice</button>
          </div>
        </div>
      )}
      {!success && (
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="username">Name (optional)</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name (optional)"
            />
          </div>
          <HumanCheck action="register" showLegal={true} />
          <div className="form-actions">
            <button className="btn btn-block" type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
          </div>
        </form>
      )}
      <p className="mt-3">
        Already have an account? <Link to="/login">Login</Link>
      </p>
      {/* Verify email prompt modal (rendered outside conditional so it always overlays) */}
      {showVerifyPrompt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="verify-modal-title"
          className="modal-overlay"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
          }}
          onClick={() => setShowVerifyPrompt(false)}
        >
          <div
            className="modal-content"
            style={{ background: '#fff', padding: '24px', borderRadius: 12, width: '90%', maxWidth: 420, boxShadow: '0 6px 24px rgba(0,0,0,.15)', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="verify-modal-title" style={{ margin: '0 0 12px', fontSize: '1.25rem' }}>Verify your email</h3>
            <p style={{ margin: '0 0 10px', fontSize: '.95rem', lineHeight: '1.45' }}>
              We sent a verification link to <strong>{email}</strong>. Please open your inbox and click the link to activate your account.
            </p>
            <p style={{ margin: '0 0 16px', fontSize: '.85rem', color: '#64748b' }}>
              Tip: Check Promotions/Spam if you don’t see it after a minute.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {provider ? (
                <a
                  href={provider.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-accent"
                  style={{ flex: '1 1 auto', justifyContent: 'center' }}
                >Open {provider.name}</a>
              ) : (
                <a
                  href="/"
                  onClick={(e) => { e.preventDefault(); setShowVerifyPrompt(false); }}
                  className="btn-accent"
                  style={{ flex: '1 1 auto', justifyContent: 'center' }}
                >Got it</a>
              )}
              <button
                type="button"
                className="btn-outline"
                style={{ flex: '1 1 auto' }}
                onClick={async () => {
                  if (!email) return;
                  setResendLoading(true);
                  try {
                    const mod = await import('../services/api');
                    await mod.resendVerificationEmail(email);
                    alert('Verification email resent. Check your inbox (and spam).');
                  } catch (e: any) {
                    alert(e?.response?.data?.message || e?.message || 'Failed to resend.');
                  } finally {
                    setResendLoading(false);
                  }
                }}
              >{resendLoading ? 'Resending…' : 'Resend Email'}</button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setShowVerifyPrompt(false)}
              >Dismiss</button>
            </div>
            <button
              aria-label="Close"
              onClick={() => setShowVerifyPrompt(false)}
              style={{ position: 'absolute', top: 8, right: 8, background: 'transparent', border: 'none', fontSize: '1.15rem', cursor: 'pointer', color: '#64748b' }}
            >×</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
