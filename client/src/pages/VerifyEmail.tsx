import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { verifyEmail } from '../services/api';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    const verify = async () => {
      try {
        const response = await verifyEmail(token);
        setStatus('success');
        setMessage(response.message || 'Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error?.response?.data?.message || 'Email verification failed. The link may be expired or invalid.');
      }
    };

    verify();
  }, [searchParams, navigate]);

  return (
    <div className="card auth-card">
      <h2>Email Verification</h2>
      
      {status === 'loading' && (
        <div>
          <p>Verifying your email address...</p>
        </div>
      )}
      
      {status === 'success' && (
        <div>
          <p className="alert alert-success">{message}</p>
          <p>You will be redirected to the login page in a few seconds.</p>
          <div className="form-actions">
            <Link to="/login" className="btn">Go to Login</Link>
          </div>
        </div>
      )}
      
      {status === 'error' && (
        <div>
          <p className="alert alert-danger">{message}</p>
          <div className="form-actions">
            <Link to="/login" className="btn">Go to Login</Link>
            <Link to="/register" className="btn-outline">Register Again</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyEmail;