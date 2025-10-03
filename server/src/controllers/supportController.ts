import { Request, Response } from 'express';
import { sendMail } from '../services/email';
import { SALES_EMAIL } from '../config/env';
import SupportRequest from '../models/SupportRequest';
import crypto from 'crypto';

export const submitSupportRequest = async (req: Request, res: Response) => {
  try {
    const { name, email, message } = req.body || {};
    if (!email || !message) {
      return res.status(400).json({ error: 'Email and message are required.' });
    }
    const emailStr = String(email).trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    const rawName = String(name || '').trim();
    if (!rawName) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    const trimmed = String(message).trim();
    const MIN_LEN = 30; // Anti-spam minimal content requirement
    if (trimmed.length < MIN_LEN) {
      return res.status(400).json({ error: `Message too short. Please provide at least ${MIN_LEN} characters.` });
    }
    if (trimmed.length > 4000) {
      return res.status(400).json({ error: 'Message too long (max 4000 chars).' });
    }
    const safeName = rawName.slice(0, 100);

    // Generate a short reference id (base36 first 8 chars of random bytes)
    const referenceId = crypto.randomBytes(6).toString('base64url').slice(0, 8);

    // Persist to database
    const doc = await SupportRequest.create({
      name: safeName,
      email: emailStr,
      message: trimmed,
      status: 'new',
      referenceId
    });

    // Notify internal sales/support (include reference id)
    const adminSubject = `Support Request from ${safeName}`;
    const adminHtml = `
      <h2>New Support / Contact Request</h2>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Reference ID:</strong> ${referenceId}</p>
      <p><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(trimmed)}</pre>
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

    return res.json({ ok: true, referenceId });
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