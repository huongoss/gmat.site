import { Request, Response } from 'express';
import { sendMail, buildBrandedEmail } from '../services/email';
import { User } from '../models/User';

// Simple internal email send using sales address as target or from? We'll send TO arbitrary recipient FROM configured SENDGRID_FROM.
// If you intended always send TO sales@gmat.site, we'll implement both: if no to provided, default to sales@gmat.site

const SALES_ADDR = process.env.SALES_EMAIL || 'sales@gmat.site';

export const sendSalesEmail = async (req: Request, res: Response) => {
  const { to, subject, html, text } = req.body as { to?: string; subject: string; html?: string; text?: string };
  if (!subject || (!html && !text)) {
    return res.status(400).json({ message: 'subject and html or text required' });
  }
  const target = to || SALES_ADDR;
  const rawBody = html || `<pre>${(text || '').replace(/</g,'&lt;')}</pre>`;
  const bodyHtml = buildBrandedEmail({ heading: subject, bodyHtml: rawBody });
  try {
    await sendMail(target, subject, bodyHtml);
    res.json({ message: 'Email queued', to: target });
  } catch (e:any) {
    res.status(500).json({ message: 'Failed to send', error: e?.message });
  }
};

// Get all users with key status fields
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({})
      .select('email username admin emailVerified subscriptionActive stripeCustomerId currentQuestionIndex lastDailyDate createdAt')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({ users });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to fetch users', error: e?.message });
  }
};

// Delete a user by ID
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: 'userId required' });
    }

    // First fetch the user to check if they are an admin
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deletion of admin users
    if (user.admin === true) {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    // Proceed with deletion
    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully', userId });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to delete user', error: e?.message });
  }
};
