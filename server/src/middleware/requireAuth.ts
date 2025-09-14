import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized access. Please log in.' });
    }

    jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token. Access denied.' });
        }

        req.user = decoded;
        next();
    });
};

export default requireAuth;