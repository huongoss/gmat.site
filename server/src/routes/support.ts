import { Router } from 'express';
import { submitSupportRequest } from '../controllers/supportController';
import recaptchaVerify from '../middleware/recaptcha';
import rateLimit from '../middleware/rateLimit';

const router = Router();

// Reuse global simple rate limiter (could be enhanced later specifically for support requests)
router.post('/contact', rateLimit, recaptchaVerify, submitSupportRequest);

export default router;