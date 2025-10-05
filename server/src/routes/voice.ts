import express from 'express';
import requireAuth from '../middleware/requireAuth';
import { voiceRealtimeService } from '../modules/voice/service';

const router = express.Router();

router.post('/session', requireAuth, async (req, res) => {
  // Fast failure if API key missing
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ message: 'Voice service not configured (missing OPENAI_API_KEY)' });
  }
  try {
    if (!voiceRealtimeService.authorize(req)) {
      return res.status(403).json({ message: 'Not allowed to use voice feature' });
    }
    const { model, voice } = req.body || {};
    const session = await voiceRealtimeService.createRealtimeSession({ model, voice });
    console.log('[voice] issued ephemeral session', { model: session.model, voice: session.voice, keyLen: session.client_secret?.value?.length });
    res.json({
      model: session.model,
      voice: session.voice,
      client_secret: session.client_secret,
      ttl: session.ttl
    });
  } catch (e: any) {
    const rawMsg = e?.message || 'Unknown error';
    const truncated = rawMsg.length > 400 ? rawMsg.slice(0,400) + '…' : rawMsg;
    console.error('[voice] session error', truncated);
    res.status(500).json({ message: 'Failed to create voice session', detail: truncated });
  }
});

export default router;
