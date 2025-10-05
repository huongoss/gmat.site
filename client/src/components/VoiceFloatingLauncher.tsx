import React, { useState } from 'react';
import VoiceChatWidget from './VoiceChatWidget';
import { useAuth } from '../context/AuthContext';

const VoiceFloatingLauncher: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  if (!isAuthenticated) return null;
  return (
    <>
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200 }}>
        {!open && (
          <button onClick={() => setOpen(true)} style={{ width: 64, height: 64, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg,#4f46e5,#6366f1)', color: '#fff', fontWeight: 600, fontSize: 12, boxShadow: '0 4px 18px rgba(0,0,0,0.25)', cursor: 'pointer' }}>
            Ask GMAT
          </button>
        )}
      </div>
      {open && (
        <div style={{ position: 'fixed', bottom: 100, right: 24, zIndex: 1300 }}>
          <VoiceChatWidget onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
};

export default VoiceFloatingLauncher;
