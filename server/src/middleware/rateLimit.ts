import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter: default 10 requests per 60 seconds per client ip
// Note: For multi-instance deployments, use a shared store (e.g., Redis) instead.
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX || 10);

const buckets = new Map<string, { count: number; first: number }>();

function getClientKey(req: Request) {
  const xf = (req.headers['x-forwarded-for'] as string) || '';
  const ip = xf.split(',')[0]?.trim() || req.ip || (req.connection as any)?.remoteAddress || 'unknown';
  return ip;
}

export default function rateLimit(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/api/payments/webhook') return next();

  const now = Date.now();
  const key = getClientKey(req);
  const entry = buckets.get(key);

  if (!entry) {
    buckets.set(key, { count: 1, first: now });
    return next();
  }

  if (now - entry.first > WINDOW_MS) {
    buckets.set(key, { count: 1, first: now });
    return next();
  }

  entry.count += 1;
  if (entry.count > MAX_REQUESTS) {
    const retryAfterSec = Math.ceil((WINDOW_MS - (now - entry.first)) / 1000);
    res.setHeader('Retry-After', String(retryAfterSec));
    return res.status(429).json({ message: 'Too many requests. Please try again later.' });
  }

  return next();
}
