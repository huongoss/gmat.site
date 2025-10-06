import express from 'express';
import requireAuth from '../middleware/requireAuth';
import optionalAuth from '../middleware/optionalAuth';
import { voiceRealtimeService } from '../modules/voice/service';
import { User } from '../models/User';

const router = express.Router();

router.post('/session', requireAuth, async (req, res) => {
  const paidKey = process.env.OPENAI_API_KEY;
  if (!paidKey) {
    return res.status(403).json({ message: 'Voice call disabled. Please subscribe to enable live tutor audio.' });
  }
  try {
    if (!voiceRealtimeService.authorize(req)) {
      return res.status(403).json({ message: 'Not allowed to use voice feature' });
    }
    const authUser: any = (req as any).user || {};
    const userId = authUser.id || authUser._id; // JWT may carry id or _id
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    // Fetch fresh user to avoid stale subscriptionActive embedded in old JWT
    const dbUser = await User.findById(userId);
    if (!dbUser) return res.status(404).json({ message: 'User not found' });
    if (!dbUser.subscriptionActive) {
      return res.status(402).json({ message: 'Subscribe to enable live voice tutoring', code: 'VOICE_SUBSCRIPTION_REQUIRED' });
    }
    const { model, voice } = req.body || {};
    const session = await voiceRealtimeService.createRealtimeSession({ model, voice }, paidKey);
    console.log('[voice] issued ephemeral session', { model: session.model, voice: session.voice, keyLen: session.client_secret?.value?.length });
    res.json({
      model: session.model,
      voice: session.voice,
      client_secret: session.client_secret,
      ttl: session.ttl,
      tutorName: session.tutorName
    });
  } catch (e: any) {
    const rawMsg = e?.message || 'Unknown error';
    const truncated = rawMsg.length > 400 ? rawMsg.slice(0,400) + '…' : rawMsg;
    console.error('[voice] session error', truncated);
    res.status(500).json({ message: 'Failed to create voice session', detail: truncated });
  }
});

// In‑memory guest rate limiter (resets daily UTC) for public text assistant usage.
// NOTE: Simple in-process store; acceptable for small scale. For multi-instance deployments,
// replace with Redis or another shared store to enforce global limits.
interface RateEntry { count: number; reset: number }
const guestRateStore: Map<string, RateEntry> = new Map();
const GUEST_DAILY_LIMIT = parseInt(process.env.GUEST_TEXT_DAILY_LIMIT || '20', 10);

function getRateEntry(key: string): RateEntry {
  const now = Date.now();
  const utc = new Date();
  const resetDate = new Date(Date.UTC(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate() + 1));
  const resetTs = resetDate.getTime();
  const existing = guestRateStore.get(key);
  if (!existing || existing.reset <= now) {
    const fresh = { count: 0, reset: resetTs };
    guestRateStore.set(key, fresh);
    return fresh;
  }
  return existing;
}

// Text-only assistant (no realtime / audio). Provides GMAT expert answer.
// PUBLIC: Allows guests (unauthenticated). Authenticated users may have higher quality (paid key) if subscribed.
router.post('/text', optionalAuth, async (req, res) => {
  const paidKey = process.env.OPENAI_API_KEY;
  const freeKey = process.env.OPENAI_API_KEY_FREE;
  if (!paidKey && !freeKey) {
    return res.status(503).json({ message: 'Assistant not configured (no API key)' });
  }
  try {
    const { question, model } = req.body || {};
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ message: 'Missing question' });
    }
    const user: any = (req as any).user || null;
    const isGuest = !user;
    if (isGuest) {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
      const entry = getRateEntry(ip);
      if (entry.count >= GUEST_DAILY_LIMIT) {
        return res.status(429).json({ message: 'Daily free question limit reached. Create a free account for more.', code: 'GUEST_LIMIT' });
      }
      entry.count++;
    }
    // Decide whether to force free key: guests always free; logged-in uses paid unless not subscribed.
    const free = isGuest || !user.subscriptionActive;
    const answer = await voiceRealtimeService.generateTextResponse(question, { model, free });
    res.json({ answer, guest: isGuest });
  } catch (e: any) {
    const msg = e?.message || 'Unknown error';
    console.error('[voice] text error', msg.slice(0,400));
    res.status(500).json({ message: 'Failed to get answer', detail: msg.slice(0,400) });
  }
});

// Increment and enforce daily voice response usage (subscribed users only)
router.post('/consume', requireAuth, async (req, res) => {
  try {
    const authUser: any = (req as any).user || {};
    if (!authUser || !authUser.id && !authUser._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const userId = authUser.id || authUser._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.subscriptionActive) {
      return res.status(402).json({ message: 'Subscription required', code: 'VOICE_SUBSCRIPTION_REQUIRED' });
    }
    const MAX_DAILY = 1;
    const now = new Date();
    const startOfUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const last = user.voiceResponsesDate ? new Date(user.voiceResponsesDate) : null;
    if (!last || last < startOfUTC) {
      user.voiceResponsesDate = now;
      user.voiceResponsesCount = 0;
    }
    if ((user.voiceResponsesCount || 0) >= MAX_DAILY) {
      return res.status(429).json({ message: 'Daily voice response limit reached (10)', code: 'VOICE_DAILY_LIMIT' });
    }
    user.voiceResponsesCount = (user.voiceResponsesCount || 0) + 1;
    await user.save();
    return res.json({ remaining: MAX_DAILY - user.voiceResponsesCount, used: user.voiceResponsesCount, limit: MAX_DAILY });
  } catch (e: any) {
    console.error('[voice] consume error', e?.message);
    return res.status(500).json({ message: 'Failed to record voice usage' });
  }
});

// Fetch current daily voice usage without incrementing
router.get('/usage', requireAuth, async (req, res) => {
  try {
    const authUser: any = (req as any).user || {};
    const userId = authUser.id || authUser._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.subscriptionActive) {
      return res.status(402).json({ message: 'Subscription required', code: 'VOICE_SUBSCRIPTION_REQUIRED' });
    }
    const MAX_DAILY = 1;
    const now = new Date();
    const startOfUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const last = user.voiceResponsesDate ? new Date(user.voiceResponsesDate) : null;
    if (!last || last < startOfUTC) {
      // Reset counters at day boundary (persist so subsequent calls consistent)
      user.voiceResponsesDate = now;
      user.voiceResponsesCount = 0;
      await user.save();
    }
    const used = user.voiceResponsesCount || 0;
    const remaining = Math.max(0, MAX_DAILY - used);
    return res.json({ remaining, used, limit: MAX_DAILY });
  } catch (e: any) {
    console.error('[voice] usage error', e?.message);
    return res.status(500).json({ message: 'Failed to fetch voice usage' });
  }
});

export default router;
