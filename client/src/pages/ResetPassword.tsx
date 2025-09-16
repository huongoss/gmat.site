import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Invalid reset link. No token provided.');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await resetPassword(token, newPassword);
      setMessage(response.message || 'Password reset successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="card auth-card">
        <h2>Reset Password</h2>
        <p className="alert alert-danger">{error}</p>
        <div className="form-actions">
          <Link to="/forgot-password" className="btn">Request New Reset Link</Link>
          <Link to="/login" className="btn-outline">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card auth-card">
      <h2>Reset Your Password</h2>
      <p>Enter your new password below.</p>
      
      {error && <p className="alert alert-danger">{error}</p>}
      {message && (
        <div>
          <p className="alert alert-success">{message}</p>
          <p>You will be redirected to the login page in a few seconds.</p>
        </div>
      )}
      
      {!message && (
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input 
              id="newPassword" 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              required 
              minLength={6}
              placeholder="Enter new password"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input 
              id="confirmPassword" 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              minLength={6}
              placeholder="Confirm new password"
            />
          </div>
          <div className="form-actions">
            <button className="btn btn-block" type="submit" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      )}
      
      <p className="mt-3">
        Remember your password? <Link to="/login">Back to Login</Link>
      </p>
    </div>
  );
};

export default ResetPassword;