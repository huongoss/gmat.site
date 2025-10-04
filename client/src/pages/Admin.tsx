import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import { adminSendEmail } from '../services/api';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'email'>('email');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user?.admin) {
    return <div className="card"><h2>Admin</h2><p>Forbidden</p></div>;
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await adminSendEmail({ to: to || undefined, subject, text: body });
      setResult(`Sent to ${res.to}`);
      setBody('');
    } catch (err:any) {
      setError(err?.response?.data?.message || err.message || 'Failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card">
      <h2>Admin</h2>
      <div className="tabs" style={{ marginBottom: '1rem', display: 'flex', gap: '.5rem' }}>
        <button className={activeTab==='email'? 'btn-inline-active':'btn-inline'} onClick={()=>setActiveTab('email')}>Email Sender</button>
      </div>
      {activeTab === 'email' && (
        <form onSubmit={send}>
          <p style={{ fontSize:'.85rem', color:'var(--color-text-subtle)' }}>Leave To blank to send to sales@gmat.site.</p>
          {error && <p className="alert alert-danger">{error}</p>}
          {result && <p className="alert alert-success">{result}</p>}
          <div className="form-group">
            <label>To (optional)</label>
            <input value={to} onChange={e=>setTo(e.target.value)} placeholder="sales@gmat.site (default)" />
          </div>
          <div className="form-group">
            <label>Subject</label>
            <input value={subject} onChange={e=>setSubject(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Body (text)</label>
            <textarea value={body} onChange={e=>setBody(e.target.value)} rows={8} required />
          </div>
          <div className="form-actions">
            <button className="btn" type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send Email'}</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Admin;
