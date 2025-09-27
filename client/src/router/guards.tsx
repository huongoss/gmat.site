import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export const RequireAuth: React.FC<{ children: React.ReactNode }>
  = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

export const GuestOnly: React.FC<{ children: React.ReactNode }>
  = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (isAuthenticated) {
    const redirect = (location.state as any)?.from?.pathname || '/account';
    return <Navigate to={redirect} replace />;
  }
  return <>{children}</>;
};
