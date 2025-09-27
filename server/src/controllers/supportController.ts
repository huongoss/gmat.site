import { Request, Response } from 'express';
import { sendMail } from '../services/email';
import { SALES_EMAIL } from '../config/env';

export const submitSupportRequest = async (req: Request, res: Response) => {
  try {
    const { name = 'Anonymous', email, message } = req.body || {};
    if (!email || !message) {
      return res.status(400).json({ error: 'Email and message are required.' });
    }

    // Basic length validation
    if (message.length > 4000) {
      return res.status(400).json({ error: 'Message too long (max 4000 chars).' });
    }

    const safeName = String(name).slice(0, 100);

    // Notify internal sales/support
    const adminSubject = `Support Request from ${safeName}`;
    const adminHtml = `
      <h2>New Support / Contact Request</h2>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(message)}</pre>
    `;
    await sendMail(SALES_EMAIL, adminSubject, adminHtml);

    // Auto-response for user
    const userSubject = 'We received your message - GMAT.site';
    const userHtml = `
      <p>Hi ${safeName || ''},</p>
      <p>Thanks for contacting GMAT.site. Your question has been received. A member of our team will review it shortly.</p>
      <p><em>This is an automated confirmation. Please do not reply to this email.</em></p>
      <p>— GMAT.site Support</p>
    `;
    await sendMail(email, userSubject, userHtml);

    return res.json({ ok: true });
  } catch (err) {
    console.error('Support request error', err);
    return res.status(500).json({ error: 'Unable to submit request right now.' });
  }
};

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default { submitSupportRequest };