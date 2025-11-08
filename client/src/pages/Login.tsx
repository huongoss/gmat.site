import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getRecaptchaToken } from '../utils/recaptcha';
import HumanCheck from '../components/HumanCheck';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const next = params.get('next') || '/account';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let recaptchaToken: string | undefined;
      try { recaptchaToken = await getRecaptchaToken('login'); } catch (e) { /* ignore dev */ }
  await login(email, password, recaptchaToken);
  navigate(next);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card auth-card">
      <h2>Login</h2>
      {error && <p className="alert alert-danger">{error}</p>}
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <HumanCheck action="login" showLegal={false} />
        <div className="form-actions">
          <button className="btn btn-block" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Login'}</button>
        </div>
      </form>
      <p className="mt-3">
        <Link to="/forgot-password">Forgot your password?</Link>
      </p>
      <p className="mt-3">
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};

export default Login;
