// GA4 analytics utilities for SPA
// Dynamically injects gtag.js and provides helpers for page views and events.
// Handles potential race where a route effect fires before GA init by stubbing and queuing.

// Augment the Window type for gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Internal state to avoid losing early page_view before GA config
let gaConfigured = false;
const pendingEvents: any[][] = []; // events captured before GA config to preserve order

// Create an early stub so trackPageview can push before initAnalytics runs
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtagStub(...args: any[]) {
      const isEvent = args[0] === 'event';
      if (!gaConfigured && isEvent) {
        // Buffer events so they occur AFTER config; don't push yet to dataLayer
        pendingEvents.push(args as any[]);
        return;
      }
      // Non-event (or post-config) commands go straight to dataLayer
      window.dataLayer.push(args);
    } as any;
  }
}

export const initAnalytics = (measurementId: string) => {
  if (!measurementId) return;
  if (gaConfigured) return; // already configured

  // Avoid duplicate script inject (in case of hot reload)
  if (!document.getElementById('ga4-tag')) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.id = 'ga4-tag';
    document.head.appendChild(script);
  }

  // Ensure stubs exist
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: any[]) {
    window.dataLayer.push(args);
  };

  // Configure GA with manual page_view so we control SPA navigations
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });

  gaConfigured = true;

  // Now flush buffered events (in original order) after config so GA processes them
  if (pendingEvents.length) {
    pendingEvents.forEach(ev => {
      try { window.gtag(...ev as any); } catch (_) { /* swallow */ }
    });
    pendingEvents.length = 0;
  }
};

export const trackPageview = (path: string, title?: string) => {
  const measurementId = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID as string | undefined;
  if (!measurementId) return;

  const eventArgs: any[] = ['event', 'page_view', {
    page_title: title || document.title,
    page_location: window.location.href,
    page_path: path,
    send_to: measurementId,
  }];

  if (typeof window.gtag !== 'function') {
    // Should rarely happen now, but queue defensively
    pendingEvents.push(eventArgs);
    return;
  }

  window.gtag(...eventArgs);
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
