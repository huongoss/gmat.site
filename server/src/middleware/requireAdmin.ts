import { Request, Response, NextFunction } from 'express';

// Assumes requireAuth has already populated req.userId and user is loaded or attach user object earlier.
// Here we do a lightweight re-fetch to confirm admin flag.
import { User } from '../models/User';

const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded: any = (req as any).user;
    const userId = decoded?.id || decoded?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(userId).select('admin');
    if (!user || !user.admin) {
      return res.status(403).json({ message: 'Forbidden: admin only' });
    }
    (req as any).adminUser = user;
    next();
  } catch (e) {
    console.error('requireAdmin error', e);
    res.status(500).json({ message: 'Server error' });
  }
};

export default requireAdmin;
