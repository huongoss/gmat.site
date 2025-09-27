import { Router } from 'express';
import { submitSupportRequest } from '../controllers/supportController';
import rateLimit from '../middleware/rateLimit';

const router = Router();

// Reuse global simple rate limiter (could be enhanced later specifically for support requests)
router.post('/contact', rateLimit, submitSupportRequest);

export default router;