import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export const RequireAuth: React.FC<{ children: React.ReactNode }>
  = ({ children }) => {
  const { isAuthenticated, authLoading } = useAuth() as any;
  const location = useLocation();
  // While authLoading, defer decision to prevent flicker/logout on refresh
  if (authLoading) {
    return <div className="card content-narrow"><p>Restoring session…</p></div>;
  }
  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

export const GuestOnly: React.FC<{ children: React.ReactNode }>
  = ({ children }) => {
  const { isAuthenticated, authLoading } = useAuth() as any;
  const location = useLocation();
  if (authLoading) {
    return null; // Don't render anything until we know auth state for guest-only pages
  }
  if (isAuthenticated) {
    const redirect = (location.state as any)?.from?.pathname || '/account';
    return <Navigate to={redirect} replace />;
  }
  return <>{children}</>;
};
