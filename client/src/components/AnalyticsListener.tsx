import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageview } from '../utils/analytics';

const AnalyticsListener = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageview(location.pathname, document.title);
  }, [location.pathname]);

  return null;
};

export default AnalyticsListener;
