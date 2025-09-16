import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await register(email, password, username || undefined);
      setSuccess('Account created successfully! Please check your email to verify your account before logging in.');
      // Don't navigate immediately, let user see the verification message
      setTimeout(() => {
        navigate('/account');
      }, 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card auth-card">
      <h2>Register</h2>
      {error && <p className="alert alert-danger">{error}</p>}
      {success && (
        <div>
          <p className="alert alert-success">{success}</p>
          <p>You will be redirected to your account in a few seconds.</p>
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
            <label htmlFor="username">Username (optional)</label>
            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="form-actions">
            <button className="btn btn-block" type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
          </div>
        </form>
      )}
      <p className="mt-3">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Register;
