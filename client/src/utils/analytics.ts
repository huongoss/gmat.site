// GA4 analytics utilities for SPA
// Dynamically injects gtag.js and provides helpers for page views and events.

// Augment the Window type for gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const initAnalytics = (measurementId: string) => {
  if (!measurementId) return;

  // Avoid duplicate init
  if (document.getElementById('ga4-tag')) return;

  // Setup dataLayer and gtag shim early
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: any[]) {
    window.dataLayer.push(args);
  };

  // Configure GA with manual page_view so we can control SPA navigations
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });

  // Inject GA4 script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.id = 'ga4-tag';
  document.head.appendChild(script);
};

export const trackPageview = (path: string, title?: string) => {
  const measurementId = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID as string | undefined;
  if (!measurementId || typeof window.gtag !== 'function') return;

  window.gtag('event', 'page_view', {
    page_title: title || document.title,
    page_location: window.location.href,
    page_path: path,
    send_to: measurementId,
  });
};

export const trackEvent = (name: string, params?: Record<string, any>) => {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', name, params || {});
};

export const setUserId = (userId?: string | null) => {
  if (typeof window.gtag !== 'function') return;
  if (!userId) {
    // Clear user id
    window.gtag('set', { user_id: undefined });
    return;
  }
  window.gtag('set', { user_id: String(userId) });
};
