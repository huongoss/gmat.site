import React, { useState, useEffect, useRef } from 'react';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { useAuth } from '../context/AuthContext';
import { askVoiceText } from '../services/api';

interface VoiceChatWidgetProps { model?: string; voice?: string; onClose?: () => void }

const promptChips = [
  'Explain a Data Sufficiency strategy with example.',
  'How can I improve pacing on Quant harder questions?',
  'Give me a framework to approach Critical Reasoning strengthen questions.',
  'Tips to avoid careless mistakes in Problem Solving?',
  'How should I review missed questions effectively?' 
];

const chipColor = '#eef2ff';
const chipBorder = '#c7d2fe';

const VoiceChatWidget: React.FC<VoiceChatWidgetProps> = ({ model, voice, onClose }) => {
  const { status, error, start, stop, transcript, sendText, tutorName, voiceQuota } = useVoiceAssistant({ model, voice });
  const { user } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [input, setInput] = useState('');
  const [chatTranscript, setChatTranscript] = useState<{ id: string; role: 'user' | 'assistant'; text: string }[]>([]);
  const [mode, setMode] = useState<'idle' | 'text' | 'calling' | 'voice'>('idle');
  const [sending, setSending] = useState(false);
  const [callElapsed, setCallElapsed] = useState(0);
  const [spinnerDone, setSpinnerDone] = useState(false); // becomes true after 10s countdown
  const callStartedRef = useRef(false); // ensures realtime start only after loading
  const progressTimerRef = useRef<number | null>(null);
  const activeVoice = status === 'connected' || status === 'connecting';
  const statusRef = useRef(status); // track latest status for interval without retriggering effect
  useEffect(() => { statusRef.current = status; }, [status]);

  const combinedTranscript = mode === 'voice' ? transcript : chatTranscript;
  const typingId = 'typing-indicator';

  useEffect(() => {
    if (mode === 'calling') {
      const startTs = Date.now();
      setSpinnerDone(false); // reset spinner state once on entering calling mode
      progressTimerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTs) / 1000);
        setCallElapsed(elapsed);
        if (elapsed >= 10 && !spinnerDone) {
          setSpinnerDone(true); // triggers separate effect to start session
        }
        // Switch to voice UI once connected after spinner period
        if (elapsed >= 10 && statusRef.current === 'connected') {
          setMode('voice');
          if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
        }
      }, 500);
      return () => { if (progressTimerRef.current) window.clearInterval(progressTimerRef.current); };
    }
  }, [mode]);

  // Separate effect: initiate realtime start only after spinner completes 10s
  useEffect(() => {
    if (mode === 'calling' && spinnerDone && !callStartedRef.current) {
      callStartedRef.current = true;
      start().catch(err => {
        console.error('[voice] start failed', err);
        setMode('idle');
      });
    }
  }, [mode, spinnerDone, start]);

  const handleTextSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    const id = 'u-' + Date.now().toString(36);
    setChatTranscript(prev => [...prev, { id, role: 'user', text }]);
    setInput('');
    try {
      // Add typing placeholder
      setChatTranscript(prev => [...prev, { id: typingId, role: 'assistant', text: 'Typing…' }]);
      const res = await askVoiceText(text);
      setChatTranscript(prev => prev.filter(m => m.id !== typingId).concat({ id: 'a-' + Date.now().toString(36), role: 'assistant', text: res.answer }));
      if (mode === 'idle') setMode('text');
    } catch (e: any) {
      setChatTranscript(prev => prev.filter(m => m.id !== typingId).concat({ id: 'err-' + Date.now().toString(36), role: 'assistant', text: 'Error: ' + (e?.message || 'Failed to get answer') }));
    } finally {
      setSending(false);
    }
  };

  const handleTalkClick = () => {
    if (mode === 'calling' || mode === 'voice') return;
    if (voiceQuota && voiceQuota.remaining <= 0) {
      // Already out of quota – surface upgrade / limit message
      setShowUpgrade(false);
      // Inject a one-time system style message into chat transcript (idle/text modes) if not already present
      setChatTranscript(prev => {
        if (prev.some(m => m.id.startsWith('quota-'))) return prev;
        return [...prev, { id: 'quota-' + Date.now().toString(36), role: 'assistant', text: 'Daily voice limit reached. Voice calls will be available again tomorrow.' }];
      });
      return;
    }
    if (!user?.subscriptionActive) {
      setShowUpgrade(true);
      return;
    }
    callStartedRef.current = false;
    setMode('calling');
    setCallElapsed(0);
    setSpinnerDone(false);
  };

  const endCall = () => {
    if (callStartedRef.current) {
      stop();
    }
    setMode('idle');
    setSpinnerDone(false);
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
  };

  // Auto-end call when quota exhausted
  useEffect(() => {
    if ((mode === 'voice' || mode === 'calling') && voiceQuota && voiceQuota.remaining <= 0) {
      // Gracefully end the session
      endCall();
    }
  }, [voiceQuota, mode]);

  const handleChip = (c: string) => {
    if (mode === 'voice') {
      sendText(c);
    } else {
      setInput(c);
    }
  };

  return (
    <div style={{ width: 420, maxWidth: '100%', display: 'flex', flexDirection: 'column', height: 560, background: '#fff', border: '1px solid #e3e8f0', borderRadius: 16, boxShadow: '0 4px 18px rgba(0,0,0,0.08)', overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600 }}>GM</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>GMAT Expert Tutor{tutorName ? ` · ${tutorName}` : ''}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {mode === 'voice' ? 'Live voice session' : mode === 'calling' ? 'Calling expert…' : 'Ask strategy, pacing, review tactics'}
          </div>
        </div>
        {onClose && <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, color: '#6b7280' }} aria-label="Close">×</button>}
      </div>
      {/* Prompt chips removed to maximize chat space */}
      {mode !== 'voice' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#ffffff', scrollBehavior: 'smooth' }}>
          {combinedTranscript.map(t => {
            const isUser = t.role === 'user';
            return (
              <div key={t.id} style={{ display: 'flex', marginBottom: 12, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                {!isUser && <div style={{ width: 36, height: 36, background: '#eef2ff', borderRadius: 10, marginRight: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#4f46e5', fontWeight: 600 }}>GM</div>}
                <div style={{ maxWidth: '75%', background: isUser ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : '#f1f5f9', color: isUser ? '#fff' : '#1e293b', padding: '8px 12px', borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px', fontSize: 13, whiteSpace: 'pre-wrap' }}>{t.text}</div>
              </div>
            );
          })}
        </div>
      )}
      {mode === 'calling' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, background: '#f8fafc' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#334155' }}>Preparing GMAT Voice Tutor…</div>
          <CallSpinner progress={Math.min(callElapsed / 10, 1)} />
          <div style={{ fontSize: 12, color: '#64748b', minHeight: 18 }}>
            {callElapsed < 10 && `Initializing secure audio context (${callElapsed}s / 10s)`}
            {callElapsed >= 10 && !spinnerDone && 'Finalizing spinner…'}
            {callElapsed >= 10 && spinnerDone && !callStartedRef.current && 'Starting realtime connection…'}
            {callElapsed >= 10 && spinnerDone && callStartedRef.current && status !== 'connected' && 'Establishing session…'}
            {callElapsed >= 10 && spinnerDone && status === 'connected' && 'Connected – activating voice…'}
          </div>
          <button onClick={endCall} style={{ background: 'transparent', border: '1px solid #dc2626', color: '#dc2626', borderRadius: 24, padding: '6px 18px', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
        </div>
      )}
      {mode === 'voice' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% 40%, #eef2ff 0%, #ffffff 70%)' }}>
          <AudioBars active={status === 'connected'} />
        </div>
      )}
      {error && <div style={{ padding: '4px 12px', color: '#b00020', fontSize: 12 }}>Error: {error}</div>}
      {mode !== 'voice' && mode !== 'calling' && (
        <div style={{ padding: 12, borderTop: '1px solid #e5e7eb', background: '#f8fafc' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleTextSend(); } }} placeholder={'Ask a GMAT question...'} style={{ flex: 1, padding: '10px 12px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: 13 }} />
            <button onClick={handleTextSend} disabled={!input.trim() || sending} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 12, padding: '0 16px', fontWeight: 600, cursor: 'pointer' }}>{sending ? '...' : 'Send'}</button>
            <button
              onClick={handleTalkClick}
              disabled={status === 'requesting' || (!!voiceQuota && voiceQuota.remaining <= 0)}
              aria-label="Start voice call with GMAT tutor"
              title="Start voice call"
              style={{
                background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '0 14px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                lineHeight: 1,
                width: 46,
                height: 42,
                opacity: (voiceQuota && voiceQuota.remaining <= 0) ? 0.55 : 1,
                cursor: (voiceQuota && voiceQuota.remaining <= 0) ? 'not-allowed' : 'pointer'
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.18 2h3a2 2 0 0 1 2 1.72c.12.81.37 1.6.72 2.34a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.74-1.36a2 2 0 0 1 2.11-.45c.74.35 1.53.6 2.34.72A2 2 0 0 1 22 16.92z" />
              </svg>
            </button>
            {voiceQuota && voiceQuota.remaining <= 0 && (
              <div style={{ position: 'absolute', bottom: 70, right: 70, background: '#1e293b', color: '#fff', padding: '8px 12px', borderRadius: 10, fontSize: 11, boxShadow: '0 4px 12px rgba(0,0,0,0.18)', maxWidth: 220 }}>
                Daily voice limit reached – try again tomorrow.
              </div>
            )}
            {showUpgrade && !user?.subscriptionActive && (
              <div style={{ position: 'absolute', bottom: 70, right: 16, background: '#1e293b', color: '#fff', padding: '10px 14px', borderRadius: 12, width: 260, fontSize: 12, boxShadow: '0 4px 14px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Voice Tutor is Pro</div>
                <div style={{ lineHeight: 1.4 }}>Subscribe to unlock live audio coaching with strategy clarifications, pacing diagnostics, and interactive follow‑ups.</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowUpgrade(false)} style={{ background: 'transparent', border: '1px solid #64748b', color: '#e2e8f0', borderRadius: 8, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Later</button>
                  <a href="/pricing" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 600 }}>See Plans</a>
                </div>
              </div>
            )}
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
            <span>Status: {mode}</span>
            <span>Text mode (no mic) until call</span>
          </div>
        </div>
      )}
      {mode === 'voice' && (
        <div style={{ padding: 10, borderTop: '1px solid #e5e7eb', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', fontSize: 11, color: '#475569' }}>
            <span>Voice connected ({status})</span>
            {voiceQuota && (
              <span style={{ color: voiceQuota.remaining === 0 ? '#dc2626' : '#6366f1' }}>
                {voiceQuota.remaining} / {voiceQuota.limit} turns left today
              </span>
            )}
          </div>
          <button onClick={endCall} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 20, padding: '6px 16px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>End Call</button>
        </div>
      )}
    </div>
  );
};

// Simple audio bars visualization (placeholder, animates when active)
const AudioBars: React.FC<{ active: boolean }> = ({ active }) => {
  const barCount = 16;
  const bars = Array.from({ length: barCount });
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 140 }}>
      {bars.map((_, i) => {
        const delay = (i * 60) % 600;
        return (
          <div
            key={i}
            style={{
              width: 6,
              borderRadius: 4,
              background: 'linear-gradient(180deg,#6366f1,#4f46e5)',
              animation: active ? `vuPulse 900ms ease-in-out ${delay}ms infinite` : 'none',
              height: active ? 40 + ((i % 5) * 12) : 20 + ((i % 5) * 4),
              opacity: active ? 1 : 0.55
            }}
          />
        );
      })}
      <style>{`
        @keyframes vuPulse {
          0% { transform: scaleY(0.4); }
          35% { transform: scaleY(1); }
          70% { transform: scaleY(0.5); }
          100% { transform: scaleY(0.4); }
        }
      `}</style>
    </div>
  );
};

// Circular progress spinner for the 10s connecting phase
const CallSpinner: React.FC<{ progress: number }> = ({ progress }) => {
  const pct = Math.min(Math.max(progress, 0), 1);
  const stroke = 6;
  const size = 120;
  const r = (size / 2) - stroke * 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - circ * pct;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
      <circle cx={size/2} cy={size/2} r={r} stroke="url(#g)" strokeWidth={stroke} fill="none" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default VoiceChatWidget;
