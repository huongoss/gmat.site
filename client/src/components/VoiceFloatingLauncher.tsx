import React, { useState } from 'react';
import VoiceChatWidget from './VoiceChatWidget';
import { useAuth } from '../context/AuthContext';
import { useAskGmatDialog } from '../context/AskGmatContext';
import { useCustomPrompt } from '../context/CustomPromptContext';

const VoiceFloatingLauncher: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { openDialog, closeDialog } = useAskGmatDialog();
  const { open, setOpen } = useCustomPrompt();
  // Always render launcher now; guests get text-only experience inside widget.
  return (
    <>
      <div className="ask-launcher" style={{ position: 'fixed', bottom: 'calc(24px + var(--bottom-banner-height, 0px) + env(safe-area-inset-bottom, 0px))', right: 24, zIndex: 2200 }}>
        {!open && (
          <button onClick={() => { setOpen(true); openDialog(); }} style={{ width: 68, height: 68, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg,#4f46e5,#6366f1)', color: '#fff', fontWeight: 600, fontSize: 12, boxShadow: '0 4px 18px rgba(0,0,0,0.25)', cursor: 'pointer', position: 'relative' }}>
            Ask GMAT
            {!isAuthenticated && (
              <span style={{ position: 'absolute', top: -8, right: -8, background: '#1e293b', color: '#fff', fontSize: 10, padding: '3px 6px', borderRadius: 10, fontWeight: 500 }}>Guest</span>
            )}
          </button>
        )}
      </div>
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(100px + var(--bottom-banner-height, 0px) + env(safe-area-inset-bottom, 0px))',
            right: 24,
            zIndex: 2300,
            width: 'auto',
          }}
        >
          {/* Dim overlay on small screens to focus the chat */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.25)',
              display: 'none'
            }}
            className="vcw-overlay"
          />
          <style>{`
            @media (max-width: 640px) {
              .vcw-overlay { display: block; }
              /* Move the closed launcher away from edges on tiny screens */
              .ask-launcher { right: 16px; }
            }
          `}</style>
          <div style={{ position: 'relative', maxWidth: '100vw' }}>
            {!isAuthenticated && (
              <div style={{ position: 'absolute', top: -34, right: 0, background: '#1e293b', color: '#fff', padding: '6px 10px', borderRadius: 10, fontSize: 11, boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
                Guest mode: text Q&A only. <a href="/register" style={{ color: '#93c5fd', textDecoration: 'none' }}>Sign up</a> for more.
              </div>
            )}
            <VoiceChatWidget onClose={() => { setOpen(false); closeDialog(); }} />
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceFloatingLauncher;
