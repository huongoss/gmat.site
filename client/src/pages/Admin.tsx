import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { adminSendEmail, adminGetAllUsers, adminDeleteUser } from '../services/api';

interface AdminUser {
  _id: string;
  email: string;
  username?: string;
  admin?: boolean;
  emailVerified?: boolean;
  subscriptionActive?: boolean;
  stripeCustomerId?: string;
  currentQuestionIndex?: number;
  lastDailyDate?: string;
  createdAt: string;
}

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'email' | 'users'>('email');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Users tab state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

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

  const loadUsers = async () => {
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const data = await adminGetAllUsers();
      setUsers(data.users || []);
    } catch (err: any) {
      setUsersError(err?.response?.data?.message || err.message || 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${email}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingUserId(userId);
    try {
      await adminDeleteUser(userId);
      setUsers(prev => prev.filter(u => u._id !== userId));
      alert('User deleted successfully');
    } catch (err: any) {
      alert(`Failed to delete user: ${err?.response?.data?.message || err.message}`);
    } finally {
      setDeletingUserId(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  return (
    <div className="card">
      <h2>Admin</h2>
      <div className="tabs" style={{ marginBottom: '1rem', display: 'flex', gap: '.5rem' }}>
        <button className={activeTab==='email'? 'btn-inline-active':'btn-inline'} onClick={()=>setActiveTab('email')}>Email Sender</button>
        <button className={activeTab==='users'? 'btn-inline-active':'btn-inline'} onClick={()=>setActiveTab('users')}>Users</button>
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
      {activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>All Users</h3>
            <button className="btn-outline" onClick={loadUsers} disabled={loadingUsers}>
              {loadingUsers ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          {usersError && <p className="alert alert-danger">{usersError}</p>}
          {loadingUsers && <p>Loading users...</p>}
          {!loadingUsers && users.length === 0 && <p>No users found.</p>}
          {!loadingUsers && users.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Email</th>
                    <th style={{ padding: '8px' }}>Username</th>
                    <th style={{ padding: '8px' }}>Admin</th>
                    <th style={{ padding: '8px' }}>Verified</th>
                    <th style={{ padding: '8px' }}>Subscribed</th>
                    <th style={{ padding: '8px' }}>Progress</th>
                    <th style={{ padding: '8px' }}>Last Daily</th>
                    <th style={{ padding: '8px' }}>Created</th>
                    <th style={{ padding: '8px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '8px' }}>{u.email}</td>
                      <td style={{ padding: '8px' }}>{u.username || '-'}</td>
                      <td style={{ padding: '8px' }}>{u.admin ? '✓' : '-'}</td>
                      <td style={{ padding: '8px' }}>{u.emailVerified ? '✓' : '✗'}</td>
                      <td style={{ padding: '8px' }}>{u.subscriptionActive ? '✓' : '✗'}</td>
                      <td style={{ padding: '8px' }}>{u.currentQuestionIndex || 0}</td>
                      <td style={{ padding: '8px' }}>
                        {u.lastDailyDate ? new Date(u.lastDailyDate).toLocaleDateString() : '-'}
                      </td>
                      <td style={{ padding: '8px' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <button
                          className="btn-outline"
                          style={{ fontSize: '.75rem', padding: '4px 8px' }}
                          onClick={() => handleDeleteUser(u._id, u.email)}
                          disabled={deletingUserId === u._id || u.admin}
                          title={u.admin ? 'Cannot delete admin users' : 'Delete user'}
                        >
                          {deletingUserId === u._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ marginTop: '1rem', fontSize: '.8rem', color: 'var(--color-text-subtle)' }}>
                Total users: {users.length}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;
