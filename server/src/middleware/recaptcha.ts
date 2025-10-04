import type { Request, Response, NextFunction } from 'express';

const MIN_SCORE = parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.5');

export async function recaptchaVerify(req: Request, res: Response, next: NextFunction) {
  try {
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    const siteKey = process.env.RECAPTCHA_SITE_KEY;

    // In non-production environments, allow bypass if keys not set
    if (!secret || !siteKey) {
      if (process.env.NODE_ENV !== 'production') return next();
      return res.status(500).json({ error: 'Captcha not configured' });
    }

    const token = (req.headers['x-recaptcha-token'] || req.body?.recaptchaToken) as string | undefined;
    if (!token) return res.status(400).json({ error: 'Missing reCAPTCHA token' });

    const params = new URLSearchParams({
      secret,
      response: token,
      remoteip: req.ip || ''
    });
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', body: params });
    const data: any = await response.json();

    if (!data.success) {
      return res.status(400).json({ error: 'Captcha failed', codes: data['error-codes'] });
    }

    if (typeof data.score === 'number' && data.score < MIN_SCORE) {
      return res.status(403).json({ error: 'Low reputation' });
    }

    (req as any).recaptchaScore = data.score;
    return next();
  } catch (err) {
    return next(err);
  }
}

export default recaptchaVerify;