import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageview } from '../utils/analytics';

const AnalyticsListener = () => {
  const location = useLocation();

  useEffect(() => {
    // Track pageview on every route change
    trackPageview(location.pathname, document.title);
    
    // Debug log in development
    if ((import.meta as any).env?.DEV) {
      console.log('[Analytics] Pageview tracked:', location.pathname);
    }
  }, [location.pathname]);

  return null;
};

export default AnalyticsListener;
