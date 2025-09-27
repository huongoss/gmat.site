import React, { useState } from 'react';
import { postSupportContact } from '../services/api';
import '../pages/Home.css'; // reuse some base spacing & typography classes

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !submitting && emailRegex.test(email) && message.trim().length > 5;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await postSupportContact({ name: name.trim(), email: email.trim(), message: message.trim() });
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
            <span>Name (optional)</span>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>Email</span>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>Message</span>
            <textarea required rows={6} value={message} onChange={e => setMessage(e.target.value)} placeholder="How can we help?" />
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
