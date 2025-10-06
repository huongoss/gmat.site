import React, { useState } from 'react';
import VoiceChatWidget from './VoiceChatWidget';
import { useAuth } from '../context/AuthContext';

const VoiceFloatingLauncher: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);
  // Always render launcher now; guests get text-only experience inside widget.
  return (
    <>
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200 }}>
        {!open && (
          <button onClick={() => setOpen(true)} style={{ width: 68, height: 68, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg,#4f46e5,#6366f1)', color: '#fff', fontWeight: 600, fontSize: 12, boxShadow: '0 4px 18px rgba(0,0,0,0.25)', cursor: 'pointer', position: 'relative' }}>
            Ask GMAT
            {!isAuthenticated && (
              <span style={{ position: 'absolute', top: -8, right: -8, background: '#1e293b', color: '#fff', fontSize: 10, padding: '3px 6px', borderRadius: 10, fontWeight: 500 }}>Guest</span>
            )}
          </button>
        )}
      </div>
      {open && (
        <div style={{ position: 'fixed', bottom: 100, right: 24, zIndex: 1300 }}>
          <div style={{ position: 'relative' }}>
            {!isAuthenticated && (
              <div style={{ position: 'absolute', top: -34, right: 0, background: '#1e293b', color: '#fff', padding: '6px 10px', borderRadius: 10, fontSize: 11, boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
                Guest mode: text Q&A only. <a href="/register" style={{ color: '#93c5fd', textDecoration: 'none' }}>Sign up</a> for more.
              </div>
            )}
            <VoiceChatWidget onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceFloatingLauncher;
