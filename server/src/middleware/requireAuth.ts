import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not set');
    }
    return secret;
};

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization || '';
        const [scheme, token] = authHeader.split(' ');

        if (scheme !== 'Bearer' || !token) {
            return res.status(401).json({ message: 'Missing or invalid Authorization header' });
        }

        const decoded = jwt.verify(token, getJwtSecret());
        req.user = decoded;
        return next();
    } catch (err: any) {
        if (err?.message === 'JWT_SECRET is not set') {
            console.error('Auth middleware misconfiguration:', err.message);
            return res.status(500).json({ message: 'Server misconfiguration' });
        }
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

export default requireAuth;