import { Request, Response } from 'express';
import { sendMail, buildBrandedEmail } from '../services/email';

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
