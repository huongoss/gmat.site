import { useCallback, useRef, useState, useEffect } from 'react';
import { createVoiceSession } from '../services/api'; // removed consumeVoiceUsage here; we'll call it lazily inside event handler
import { consumeVoiceUsage, fetchVoiceUsage } from '../services/api';

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
  const statusRef = useRef<VoiceStatus>('idle');
  useEffect(() => { statusRef.current = status; }, [status]);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const tutorNameRef = useRef<string | null>(null);
  const greetedRef = useRef(false);
  const lastCountedUserUtteranceIdsRef = useRef<Set<string>>(new Set()); // track which spoken user utterances consumed quota
  const [voiceQuota, setVoiceQuota] = useState<{ remaining: number; used: number; limit: number } | null>(null);
  const startingRef = useRef(false); // prevents multiple concurrent session starts
  const minuteUsageTimerRef = useRef<number | null>(null); // interval id for per-minute usage counting
  const minuteTickRef = useRef(0);

  const ensureRemoteAudioEl = () => {
    if (!remoteAudioRef.current) {
      const el = document.createElement('audio');
      el.autoplay = true;
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
    startingRef.current = false; // allow future starts
  }, []);

  const start = useCallback(async () => {
    try {
      // Idempotency / re-entry guard
      if (startingRef.current || status === 'requesting' || status === 'connecting' || status === 'connected') {
        console.log('[voice] start ignored (already starting or active)', { status, starting: startingRef.current });
        return;
      }
      startingRef.current = true;
      setError(null);
      setStatus('requesting');
      const session = await createVoiceSession({ model: opts.model, voice: opts.voice }).catch((err: any) => {
        const serverMsg = err?.response?.data?.detail || err?.response?.data?.message;
        throw new Error(serverMsg || err.message || 'Failed to create session');
      });
      setStatus('connecting');
      tutorNameRef.current = (session as any).tutorName || null;
      // Fetch current quota after session creation (does not decrement)
      fetchVoiceUsage().then(setVoiceQuota).catch(() => {});

      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setStatus('connected');
        }
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
      let lastAssistantTs = 0;

      const sendIntroEvent = (explicit: boolean) => {
        if (!dataChannelRef.current || greetedRef.current) return;
        try {
          const base = tutorNameRef.current || 'your tutor';
          const introInstructions = explicit
            ? `Introduce yourself briefly as ${base}, a friendly, concise GMAT tutor. Then ask how you can help.`
            : `Greet the user briefly as ${base} and ask how you can help with GMAT prep.`;
          const payload: any = {
            type: 'response.create',
            response: {
              modalities: ['audio','text'],
              instructions: introInstructions
            }
          };
          dataChannelRef.current.send(JSON.stringify(payload));
          console.log('[voice] sent intro response.create', payload);
        } catch (e) {
          console.warn('[voice] failed to send intro event', e);
        }
      };

      // helper to consume usage for an assistant ANSWER (count completed answers, not user utterances)
      // We count on response.audio_transcript.done (full audio answer finalized) and skip the FIRST greeting answer.
      const countedAnswerIdsRef = lastCountedUserUtteranceIdsRef; // reuse existing ref storage structure
      const countAssistantAnswer = async (answerId: string) => {
        if (countedAnswerIdsRef.current.has(answerId)) return; // already counted
        const currentStatus = statusRef.current;
        if (currentStatus !== 'connected' && currentStatus !== 'connecting') {
            if (process.env.NODE_ENV !== 'production') {
              console.debug('[voice][quota] skip answer count – status not active', { answerId, currentStatus });
            }
            return;
        }
        // Skip very first assistant greeting (do not penalize)
        if (!greetedRef.current) {
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[voice][quota] skipping first greeting answer for quota');
          }
          countedAnswerIdsRef.current.add(answerId); // mark so we don't reconsider
          return;
        }
        try {
          const usage = await consumeVoiceUsage();
          countedAnswerIdsRef.current.add(answerId);
          setVoiceQuota(usage);
          if (usage.remaining <= 0) {
            setTranscript(prev => [...prev, { id: 'limit-'+Date.now().toString(36), role: 'assistant', text: 'Daily voice limit reached. Please come back tomorrow.' }]);
          }
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[voice][quota] counted assistant answer', { answerId, usage });
          }
        } catch (e: any) {
          const statusCode = e?.response?.status;
          const code = e?.response?.data?.code;
          if (statusCode === 429 || code === 'VOICE_DAILY_LIMIT') {
            countedAnswerIdsRef.current.add(answerId);
            setTranscript(prev => [...prev, { id: 'limit-'+Date.now().toString(36), role: 'assistant', text: 'You have reached today\'s max voice responses. Try again tomorrow.' }]);
            setVoiceQuota(prev => prev ? { ...prev, remaining: 0, used: prev.limit } : { remaining: 0, used: 10, limit: 10 });
            if (process.env.NODE_ENV !== 'production') {
              console.debug('[voice][quota] limit reached (assistant answer)', { answerId });
            }
          } else if (statusCode === 402) {
            setTranscript(prev => [...prev, { id: 'sub-'+Date.now().toString(36), role: 'assistant', text: 'Subscribe to enable more voice tutoring.' }]);
          }
        }
      };

      dc.onopen = () => {
        console.log('[voice] data channel open');
        //sendIntroEvent(false);
      };
      dc.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'transcript.delta') {
            setTranscript(prev => {
              const existing = prev.find(t => t.id === msg.id);
              if (existing) return prev.map(t => t.id === msg.id ? { ...t, text: t.text + msg.delta } : t);
              return [...prev, { id: msg.id, role: (msg.role || 'assistant'), text: msg.delta }];
            });
            lastAssistantTs = Date.now();
          } else if (msg.type === 'transcript.completed') {
            setTranscript(prev => prev.map(t => t.id === msg.id ? { ...t, text: msg.text } : t));
            lastAssistantTs = Date.now();
            if (msg.role === 'assistant') {
              greetedRef.current = true;
            }
            // (No longer counting on user transcript completion; usage now tied to assistant answer completion events.)
          } else if (msg.type === 'response.created') {
            console.log('[voice:event] response.created', msg);
          } else if (msg.type === 'response.completed') {
            console.log('[voice:event] response.completed', msg);
          } else if (msg.type === 'response.audio_transcript.done') {
            // Audio answer finished – count assistant answer usage.
            if (msg.response_id) countAssistantAnswer(msg.response_id);
          } else if (msg.type === 'response.output_text.delta') {
            setTranscript(prev => {
              const existing = prev.find(t => t.id === msg.response_id);
              if (existing) return prev.map(t => t.id === msg.response_id ? { ...t, text: t.text + msg.delta } : t);
              return [...prev, { id: msg.response_id, role: 'assistant', text: msg.delta }];
            });
            lastAssistantTs = Date.now();
          } else if (msg.type === 'response.output_text.done') {
            setTranscript(prev => prev.map(t => t.id === msg.response_id ? { ...t, text: msg.text || t.text } : t));
            lastAssistantTs = Date.now();
            greetedRef.current = true;
          } else if (msg.type === 'response.done') {
            const status = msg?.response?.status;
            if (status === 'failed') {
              const errObj = msg?.response?.status_details?.error;
              console.error('[voice:event] response.done with FAILED status', errObj);
            }
          } else if (msg.type === 'error') {
            console.warn('[voice:event] error', msg);
          } else if (msg.type === 'warning') {
            console.warn('[voice:event] warning', msg);
          } else if (msg.type === 'logs') {
            console.log('[voice:event] logs', msg);
          } else {
            console.log('[voice:event] other', msg);
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
        startingRef.current = false;
        return;
      }

    } catch (e: any) {
      console.error('[voice-hook] start error', e);
      setError(e?.message || 'Unknown error');
      setStatus('error');
      startingRef.current = false;
    }
    // Keep startingRef true while connected; stop() will reset it. If connection failed above we already reset.
  }, [opts.autoStartMic, opts.model, opts.voice, status]);

  // Safety: if UI logic delays switching modes, ensure we don't recreate sessions and prevent "loading" reappearance.
  // This hook itself doesn't manage mode (widget owns it), but we expose a stable signal: once connected, status stays connected until stop().
  // If an outer component mis-reads status transitions and tries to start again, startingRef prevents it.
  // Also, if the peer connection momentarily changes state we don't reset startingRef unless fully stopped.
  useEffect(() => {
    if (status === 'error') {
      startingRef.current = false; // allow retry on explicit error
    }
  }, [status]);

  // Per-minute fallback usage counting: every full minute of a connected session counts as one answer.
  useEffect(() => {
    const active = statusRef.current === 'connected';
    if (active && minuteUsageTimerRef.current == null) {
      minuteTickRef.current = 0;
      minuteUsageTimerRef.current = window.setInterval(async () => {
        // Each minute increment attempt; stop if quota depleted
        minuteTickRef.current += 1;
        if (!voiceQuota || voiceQuota.remaining > 0) {
          try {
            const usage = await consumeVoiceUsage();
            setVoiceQuota(usage);
            if (process.env.NODE_ENV !== 'production') {
              console.debug('[voice][quota] minute usage consumed', { minute: minuteTickRef.current, usage });
            }
            if (usage.remaining <= 0 && minuteUsageTimerRef.current) {
              window.clearInterval(minuteUsageTimerRef.current);
              minuteUsageTimerRef.current = null;
            }
          } catch (e: any) {
            const statusCode = e?.response?.status;
            const code = e?.response?.data?.code;
            if (statusCode === 429 || code === 'VOICE_DAILY_LIMIT') {
              setVoiceQuota(prev => prev ? { ...prev, remaining: 0, used: prev.limit } : { remaining: 0, used: 10, limit: 10 });
              if (minuteUsageTimerRef.current) {
                window.clearInterval(minuteUsageTimerRef.current);
                minuteUsageTimerRef.current = null;
              }
            }
          }
        } else if (minuteUsageTimerRef.current) {
          window.clearInterval(minuteUsageTimerRef.current);
          minuteUsageTimerRef.current = null;
        }
      }, 60_000); // 1 minute cadence
    }
    if (!active && minuteUsageTimerRef.current != null) {
      window.clearInterval(minuteUsageTimerRef.current);
      minuteUsageTimerRef.current = null;
    }
    return () => {
      if (minuteUsageTimerRef.current) {
        window.clearInterval(minuteUsageTimerRef.current);
        minuteUsageTimerRef.current = null;
      }
    };
  // We intentionally depend on status and voiceQuota (for early stop); statusRef mirrors status anyway.
  }, [status, voiceQuota]);

  const sendText = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const id = 'user-' + Date.now().toString(36);
    setTranscript(prev => [...prev, { id, role: 'user', text: trimmed }]);
    try {
      dataChannelRef.current?.send(JSON.stringify({ type: 'user.text', text: trimmed, id }));
    } catch { /* ignore */ }
  }, []);

  return { status, error, start, stop, transcript, sendText, tutorName: tutorNameRef.current, voiceQuota };
}
