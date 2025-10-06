import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Optional auth: if a Bearer token is present and valid, attaches decoded user to req.user.
// If missing or invalid, silently continues as guest (no 401/403 response).
// Used for endpoints that allow guest usage (e.g., public text assistant) but prefer
// personalization or different limits for authenticated users when available.

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || 'testsecret';
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
};

export default function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');
    if (scheme === 'Bearer' && token) {
      try {
        const decoded = jwt.verify(token, getJwtSecret());
        (req as any).user = decoded;
      } catch (err) {
        // Invalid token -> ignore and proceed as guest
      }
    }
  } catch {
    // Silently ignore unexpected errors; treat as guest
  }
  return next();
}
