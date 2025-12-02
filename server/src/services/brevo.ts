/**
 * Brevo (formerly Sendinblue) Email Service
 * Alternative to SendGrid for sending transactional emails
 */
import SibApiV3Sdk from 'sib-api-v3-sdk';

const BRAND_NAME = process.env.BRAND_NAME || 'GMAT Practice';

// Initialize Brevo API client
let apiInstance: SibApiV3Sdk.TransactionalEmailsApi | null = null;

function getBrevoClient(): SibApiV3Sdk.TransactionalEmailsApi {
  if (!apiInstance) {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY || '';
    apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  }
  return apiInstance;
}

/**
 * Send email via Brevo
 */
export const sendBrevoMail = async (to: string, subject: string, htmlContent: string) => {
  const fromEmail = process.env.BREVO_FROM_EMAIL || process.env.MAIL_FROM || 'no-reply@example.com';
  const fromName = process.env.BREVO_FROM_NAME || BRAND_NAME;

  if (!process.env.BREVO_API_KEY) {
    console.log('[DEV EMAIL - Brevo]', { to, subject, htmlContent });
    return;
  }

  try {
    const client = getBrevoClient();
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    sendSmtpEmail.sender = { name: fromName, email: fromEmail };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;

    const result = await client.sendTransacEmail(sendSmtpEmail);
    console.log(`[Brevo] Email sent successfully to ${to}`, result);
    return result;
  } catch (error: any) {
    console.error('[Brevo] Error sending email:', error?.response?.text || error?.message || error);
    throw error;
  }
};

/**
 * Create an email campaign via Brevo
 */
export const createBrevoEmailCampaign = async (options: {
  name: string;
  subject: string;
  htmlContent: string;
  listIds?: number[];
  scheduledAt?: string;
}) => {
  if (!process.env.BREVO_API_KEY) {
    console.log('[DEV EMAIL CAMPAIGN - Brevo]', options);
    return;
  }

  try {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    const campaignApi = new SibApiV3Sdk.EmailCampaignsApi();
    const emailCampaigns = new SibApiV3Sdk.CreateEmailCampaign();
    
    const fromEmail = process.env.BREVO_FROM_EMAIL || process.env.MAIL_FROM || 'no-reply@example.com';
    const fromName = process.env.BREVO_FROM_NAME || BRAND_NAME;

    emailCampaigns.name = options.name;
    emailCampaigns.subject = options.subject;
    emailCampaigns.sender = { name: fromName, email: fromEmail };
    emailCampaigns.type = 'classic';
    emailCampaigns.htmlContent = options.htmlContent;
    
    if (options.listIds && options.listIds.length > 0) {
      emailCampaigns.recipients = { listIds: options.listIds };
    }
    
    if (options.scheduledAt) {
      emailCampaigns.scheduledAt = options.scheduledAt;
    }

    const result = await campaignApi.createEmailCampaign(emailCampaigns);
    console.log('[Brevo] Campaign created successfully:', result);
    return result;
  } catch (error: any) {
    console.error('[Brevo] Error creating campaign:', error?.response?.text || error?.message || error);
    throw error;
  }
};

/**
 * Send verification email via Brevo
 */
export const sendBrevoVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  const subject = `Verify Your Email - ${BRAND_NAME} App`;
  const htmlContent = `
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

  await sendBrevoMail(email, subject, htmlContent);
};

/**
 * Send password reset email via Brevo
 */
export const sendBrevoPasswordResetEmail = async (email: string, token: string) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  
  const subject = `Reset Your Password - ${BRAND_NAME} App`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF5722; color: white; text-align: center; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; background-color: #FF5722; color: white; text-decoration: none; padding: 15px 30px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>We received a request to reset your password for your ${BRAND_NAME} account. Click the button below to create a new password:</p>
          
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          
          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 3px;">
            ${resetUrl}
          </p>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> This password reset link will expire in 1 hour for your security.
          </div>
          
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.</p>
        </div>
        <div class="footer">
          <p>© 2024 ${BRAND_NAME} App. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendBrevoMail(email, subject, htmlContent);
};
