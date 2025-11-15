import React, { useEffect, useState } from 'react';

// Types for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt: () => Promise<void>;
}

function isStandalone() {
  // iOS Safari exposes navigator.standalone when installed
  // Other browsers support display-mode media query
  return (
    // @ts-ignore
    (typeof navigator !== 'undefined' && navigator.standalone) ||
    (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
  );
}

function isiOS() {
  const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '').toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

const InstallPrompt: React.FC = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosTip, setIosTip] = useState(false);

  // Expose a CSS variable so floating UI can avoid being occluded by this banner
  useEffect(() => {
    const updateVar = () => {
      const height = (visible || iosTip) ? '76px' : '0px';
      document.documentElement.style.setProperty('--bottom-banner-height', height);
    };
    updateVar();
    return () => {
      document.documentElement.style.setProperty('--bottom-banner-height', '0px');
    };
  }, [visible, iosTip]);

  useEffect(() => {
    if (isStandalone()) return; // already installed

    // iOS doesn't fire beforeinstallprompt. Show a small tip.
    if (isiOS()) {
      // Only show on Safari (rough check)
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (isSafari) {
        setIosTip(true);
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler as any);
    return () => window.removeEventListener('beforeinstallprompt', handler as any);
  }, []);

  if (isStandalone()) return null;

  const onInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    try {
      const choice = await deferred.userChoice;
      // Hide after user makes a choice
      setVisible(false);
      setDeferred(null);
      if (choice.outcome === 'accepted') {
        // no-op
      }
    } catch {
      setVisible(false);
      setDeferred(null);
    }
  };

  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 12, display: 'flex', justifyContent: 'center', zIndex: 2000 }}>
      {visible && (
        <div style={{ background: 'rgba(20,22,30,0.9)', color: '#fff', padding: '10px 14px', borderRadius: 12, boxShadow: '0 6px 20px rgba(0,0,0,0.25)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span>Install GMAT Practice?</span>
          <button className="btn" onClick={onInstall} style={{ padding: '6px 10px' }}>Install</button>
          <button className="btn btn-ghost" onClick={() => setVisible(false)} style={{ padding: '6px 10px' }}>Not now</button>
        </div>
      )}
      {!visible && iosTip && (
        <div style={{ background: 'rgba(20,22,30,0.9)', color: '#fff', padding: '10px 14px', borderRadius: 12, boxShadow: '0 6px 20px rgba(0,0,0,0.25)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>Add to Home Screen: tap Share
            <span aria-hidden> ⬆️</span> then "Add to Home Screen"</span>
          <button className="btn btn-ghost" onClick={() => setIosTip(false)} style={{ padding: '6px 10px' }}>Got it</button>
        </div>
      )}
    </div>
  );
};

export default InstallPrompt;
