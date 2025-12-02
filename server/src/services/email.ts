import sgMail from '@sendgrid/mail';
import crypto from 'crypto';
import { sendBrevoMail } from './brevo';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

const BRAND_NAME = process.env.BRAND_NAME || 'GMAT Practice';

// Determine which email service to use based on environment
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'sendgrid'; // 'sendgrid' or 'brevo'

/**
 * Main email sending function - routes to appropriate provider
 */
export const sendMail = async (to: string, subject: string, html: string) => {
  // Check for email provider preference
  if (EMAIL_PROVIDER === 'brevo' && process.env.BREVO_API_KEY) {
    return sendBrevoMail(to, subject, html);
  }
  
  // Default to SendGrid
  const fromRaw = process.env.SENDGRID_FROM_EMAIL || process.env.MAIL_FROM || 'no-reply@example.com';
  // If sender already includes a display name (has < or ") keep it; else wrap with brand name
  const from = /</.test(fromRaw) ? fromRaw : `${BRAND_NAME} <${fromRaw}>`;

  if (!process.env.SENDGRID_API_KEY) {
    console.log('[DEV EMAIL - SendGrid]', { to, subject, html });
    return;
  }

  const msg = {
    to,
    from,
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log(`[SendGrid] Email sent successfully to ${to}`);
  } catch (error) {
    console.error('[SendGrid] Error sending email:', error);
    throw error;
  }
};

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  const subject = `Verify Your Email - ${BRAND_NAME} App`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; text-align: center; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; background-color: #4CAF50; color: white; text-decoration: none; padding: 15px 30px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${BRAND_NAME} App!</h1>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Thank you for signing up! To complete your registration and start practicing GMAT questions, please verify your email address by clicking the button below:</p>
          
          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </p>
          
          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 3px;">
            ${verificationUrl}
          </p>
          
          <p><strong>This verification link will expire in 24 hours.</strong></p>
          
          <p>If you didn't create an account with us, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2024 ${BRAND_NAME} App. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendMail(email, subject, html);
};

export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  
  const subject = `Reset Your Password - ${BRAND_NAME} App`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; text-align: center; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; background-color: #2196F3; color: white; text-decoration: none; padding: 15px 30px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>We received a request to reset your password for your ${BRAND_NAME} App account. Click the button below to set a new password:</p>
          
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          
          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 3px;">
            ${resetUrl}
          </p>
          
          <p><strong>This reset link will expire in 1 hour.</strong></p>
          
          <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>© 2024 ${BRAND_NAME} App. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendMail(email, subject, html);
};

// Generic branded email wrapper (re-uses styling similar to verification emails)
export const buildBrandedEmail = (options: {
  title?: string; // Title shown in header bar
  heading?: string; // H2 heading inside content area
  bodyHtml: string; // Already-safe HTML markup for body
}): string => {
  const { title = `Message from ${BRAND_NAME} Team`, heading, bodyHtml } = options;
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset=\"utf-8\" />
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.55; color: #333; margin:0; padding:0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: #fff; text-align: center; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        h1,h2,h3 { margin-top: 0; font-weight: 600; }
        .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #666; }
        a.button { display:inline-block; background:#4CAF50; color:#fff !important; text-decoration:none; padding:12px 22px; border-radius:4px; }
        code,pre { font-family: monospace; background:#eee; padding:2px 4px; border-radius:3px; }
      </style>
    </head>
    <body>
      <div class=\"container\">
        <div class=\"header\"><h1>${title}</h1></div>
        <div class=\"content\">
          ${heading ? `<h2>${heading}</h2>` : ''}
          ${bodyHtml}
          <p style=\"margin-top:32px; font-size:13px; color:#555\">— ${BRAND_NAME} Team<br/>This message was sent by an authorized team member.</p>
        </div>
        <div class=\"footer\">© ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</div>
      </div>
    </body>
  </html>`;
};
