import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { verifyEmail } from '../services/api';
import useAuth from '../hooks/useAuth';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const { refreshProfile, isAuthenticated } = useAuth();

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
        // Mark verification for other pages (Account) to trigger fresh profile fetch if needed
        try { localStorage.setItem('justVerifiedEmail', '1'); } catch {}
        // Attempt silent profile refresh immediately
        try { await refreshProfile(); } catch {}
        // Poll profile until emailVerified flips or attempts exhausted (handles backend propagation delay)
        let attempts = 0;
        const poll = async () => {
          attempts++;
            try {
              await refreshProfile();
            } catch {}
            const storedUserRaw = localStorage.getItem('user');
            const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
            if (storedUser?.emailVerified || attempts >= 5) {
              try { localStorage.removeItem('justVerifiedEmail'); } catch {}
              // Navigate based on auth state
              if (isAuthenticated) navigate('/daily?intro=1');
              else navigate('/login?next=/daily?intro=1');
              return;
            }
            setTimeout(poll, 800);
        };
        setTimeout(poll, 600);
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
          <p>Launching your first GMAT micro‑set shortly… (If it takes longer than a few seconds you can start now.)</p>
          <div className="form-actions">
            <Link to="/daily?intro=1" className="btn">Skip waiting – Start Practice</Link>
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