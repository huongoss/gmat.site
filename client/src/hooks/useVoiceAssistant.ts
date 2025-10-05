import { useCallback, useRef, useState } from 'react';
import { createVoiceSession } from '../services/api';

export type VoiceStatus = 'idle' | 'requesting' | 'connecting' | 'connected' | 'stopped' | 'error';

interface TranscriptItem {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface UseVoiceAssistantOptions {
  autoStartMic?: boolean;
  model?: string;
  voice?: string;
}

export function useVoiceAssistant(opts: UseVoiceAssistantOptions = {}) {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  const ensureRemoteAudioEl = () => {
    if (!remoteAudioRef.current) {
      const el = document.createElement('audio');
      el.autoplay = true;
  // playsInline is primarily for video; not needed for audio element
      remoteAudioRef.current = el;
      document.body.appendChild(el);
    }
    return remoteAudioRef.current;
  };

  const stop = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setStatus('stopped');
  }, []);

  const start = useCallback(async () => {
    try {
      setError(null);
      setStatus('requesting');
      const session = await createVoiceSession({ model: opts.model, voice: opts.voice }).catch((err: any) => {
        // Surface server-provided detail if present
        const serverMsg = err?.response?.data?.detail || err?.response?.data?.message;
        throw new Error(serverMsg || err.message || 'Failed to create session');
      });
      setStatus('connecting');

  const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') setStatus('connected');
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setStatus('error');
          setError('Peer connection failed');
        }
      };

      pc.ontrack = (ev) => {
        const remote = ensureRemoteAudioEl();
        const inbound = remote.srcObject as MediaStream | null;
        if (!inbound) {
          remote.srcObject = new MediaStream([ev.track]);
        } else if (!inbound.getTracks().includes(ev.track)) {
          inbound.addTrack(ev.track);
        }
      };

      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;
      dc.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'transcript.delta') {
            setTranscript(prev => {
              const existing = prev.find(t => t.id === msg.id);
              if (existing) return prev.map(t => t.id === msg.id ? { ...t, text: t.text + msg.delta } : t);
              return [...prev, { id: msg.id, role: msg.role || 'assistant', text: msg.delta }];
            });
          } else if (msg.type === 'transcript.completed') {
            setTranscript(prev => prev.map(t => t.id === msg.id ? { ...t, text: msg.text } : t));
          } else if (msg.type === 'response.output_text.delta') {
            // Some realtime variants send different delta types; normalize
            setTranscript(prev => {
              const existing = prev.find(t => t.id === msg.response_id);
              if (existing) return prev.map(t => t.id === msg.response_id ? { ...t, text: t.text + msg.delta } : t);
              return [...prev, { id: msg.response_id, role: 'assistant', text: msg.delta }];
            });
          } else if (msg.type === 'response.output_text.done') {
            setTranscript(prev => prev.map(t => t.id === msg.response_id ? { ...t, text: msg.text || t.text } : t));
          }
        } catch { /* ignore */ }
      };

      if (opts.autoStartMic !== false) {
        localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));
      } else {
        pc.addTransceiver('audio', { direction: 'recvonly' });
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Per OpenAI realtime browser guidance, supply the ephemeral key via subprotocol since we cannot set headers.
      // Order: base 'realtime' protocol, then the insecure api key carrier, then beta version tag.
      // --- HTTP SDP exchange (no separate websocket for negotiation) ---
      let answerSdp: string | null = null;
      try {
        const resp = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(session.model)}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.client_secret.value}`,
            'Content-Type': 'application/sdp'
          },
          body: offer.sdp || ''
        });
        if (!resp.ok) {
          const text = await resp.text();
            throw new Error(`SDP exchange failed ${resp.status}: ${text.slice(0,200)}`);
        }
        answerSdp = await resp.text();
      } catch (err: any) {
        console.error('[voice] SDP POST failed', err);
        setError(err.message || 'SDP exchange failed');
        setStatus('error');
        return;
      }

      try {
        await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      } catch (err: any) {
        console.error('[voice] setRemoteDescription failed', err);
        setError('Failed to set remote description');
        setStatus('error');
        return;
      }

    } catch (e: any) {
      console.error('[voice-hook] start error', e);
      setError(e?.message || 'Unknown error');
      setStatus('error');
    }
  }, [opts.autoStartMic, opts.model, opts.voice, status]);

  const sendText = useCallback((text: string) => {
    // Add locally as a user message
    const id = 'user-' + Date.now().toString(36);
    setTranscript(prev => [...prev, { id, role: 'user', text }]);
    // Attempt to send over data channel (future provider integration)
    try {
      dataChannelRef.current?.send(JSON.stringify({ type: 'user.text', text, id }));
    } catch { /* ignore */ }
  }, []);

  return { status, error, start, stop, transcript, sendText };
}
