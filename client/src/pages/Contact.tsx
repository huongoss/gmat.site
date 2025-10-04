import React, { useState } from 'react';
import { postSupportContact } from '../services/api';
import { getRecaptchaToken } from '../utils/recaptcha';
import '../pages/Home.css'; // reuse some base spacing & typography classes

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MIN_LEN = 30;
  const trimmedMessage = message.trim();
  const canSubmit = !submitting && emailRegex.test(email) && trimmedMessage.length >= MIN_LEN;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      let recaptchaToken: string | undefined;
      try { recaptchaToken = await getRecaptchaToken('contact'); } catch (e) { /* fail soft in dev */ }
      await postSupportContact({ name: name.trim(), email: email.trim(), message: message.trim(), recaptchaToken });
      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to send. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="content-narrow section-base">
      <h1 className="hero-title" style={{ fontSize: '2rem', marginBottom: 'var(--space-4)' }}>Contact Us</h1>
      {success && (
        <div style={{ background: 'var(--color-surface-alt)', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 8, marginBottom: 'var(--space-4)' }}>
          <strong>Message sent.</strong> We'll get back to you soon.
        </div>
      )}
      {error && (
        <div style={{ background: 'rgba(200,0,0,0.08)', padding: 'var(--space-3)', border: '1px solid rgba(200,0,0,0.4)', borderRadius: 8, marginBottom: 'var(--space-4)', color: '#700' }}>
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} style={{ display: success ? 'none' : 'block' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>Name</span>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={email && !emailRegex.test(email) ? { borderColor: 'var(--color-danger, #c00)', outlineColor: 'var(--color-danger, #c00)' } : undefined}
            />
            {email && !emailRegex.test(email) && (
              <div style={{ fontSize: '.75rem', color: 'var(--color-danger, #b00000)' }}>Enter a valid email address.</div>
            )}
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>Message <span style={{ fontWeight: 400, opacity: 0.7 }}>(min {MIN_LEN} chars)</span></span>
            <textarea required rows={6} value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your question or issue in at least a few sentences." />
            <div style={{ fontSize: '.75rem', opacity: 0.7 }}>
              {trimmedMessage.length < MIN_LEN
                ? `Need ${MIN_LEN - trimmedMessage.length} more character(s)`
                : 'Looks good'}
            </div>
          </label>
          <div>
            <button className="btn btn-accent" disabled={!canSubmit} type="submit">
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
