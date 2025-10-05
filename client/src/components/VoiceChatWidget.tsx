import React, { useState } from 'react';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';

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
  const { status, error, start, stop, transcript, sendText } = useVoiceAssistant({ model, voice });
  const [input, setInput] = useState('');

  const active = status === 'connected' || status === 'connecting';

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendText(text);
    setInput('');
  };

  const handleChip = (c: string) => {
    if (!active) start().then(() => sendText(c)); else sendText(c);
  };

  return (
    <div style={{ width: 420, maxWidth: '100%', display: 'flex', flexDirection: 'column', height: 560, background: '#fff', border: '1px solid #e3e8f0', borderRadius: 16, boxShadow: '0 4px 18px rgba(0,0,0,0.08)', overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600 }}>GM</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>GMAT Expert Tutor</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{active ? 'Listening & analyzing...' : 'Ask strategy, pacing, review tactics'}</div>
        </div>
        {onClose && <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, color: '#6b7280' }} aria-label="Close">×</button>}
      </div>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {promptChips.map(c => (
            <button key={c} onClick={() => handleChip(c)} style={{ border: `1px solid ${chipBorder}`, background: chipColor, padding: '4px 8px', borderRadius: 20, fontSize: 11, lineHeight: 1.2, cursor: 'pointer' }}>{c.replace(/\.$/, '')}</button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#ffffff', scrollBehavior: 'smooth' }}>
        {transcript.length === 0 && (
          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
            Start a realtime session and speak, or click a prompt above. Your audio is streamed securely. The assistant will respond with expert GMAT guidance.
          </div>
        )}
        {transcript.map(t => {
          const isUser = t.role === 'user';
          return (
            <div key={t.id} style={{ display: 'flex', marginBottom: 12, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
              {!isUser && <div style={{ width: 36, height: 36, background: '#eef2ff', borderRadius: 10, marginRight: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#4f46e5', fontWeight: 600 }}>GM</div>}
              <div style={{ maxWidth: '75%', background: isUser ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : '#f1f5f9', color: isUser ? '#fff' : '#1e293b', padding: '8px 12px', borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px', fontSize: 13, whiteSpace: 'pre-wrap' }}>{t.text}</div>
            </div>
          );
        })}
      </div>
      {error && <div style={{ padding: '4px 12px', color: '#b00020', fontSize: 12 }}>Error: {error}</div>}
      <div style={{ padding: 12, borderTop: '1px solid #e5e7eb', background: '#f8fafc' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }} placeholder={active ? 'Type a follow-up...' : 'Start & ask a question...'} style={{ flex: 1, padding: '10px 12px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: 13 }} />
          {!active && (
            <button onClick={start} disabled={status === 'requesting'} style={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)', color: '#fff', border: 'none', borderRadius: 12, padding: '0 18px', fontWeight: 600, cursor: 'pointer' }}>{status === 'requesting' ? '...' : 'Start'}</button>
          )}
          {active && (
            <button onClick={handleSend} disabled={!input.trim()} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 12, padding: '0 18px', fontWeight: 600, cursor: 'pointer' }}>Send</button>
          )}
          {active && (
            <button onClick={stop} style={{ background: '#fff', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 12, padding: '0 14px', fontWeight: 600, cursor: 'pointer' }}>Stop</button>
          )}
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
          <span>Status: {status}</span>
          <span>{active ? 'Mic active · streaming' : 'Mic idle'}</span>
        </div>
      </div>
    </div>
  );
};

export default VoiceChatWidget;
