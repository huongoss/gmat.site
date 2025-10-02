import express from 'express';
import { 
	register, 
	login, 
	getUserProfile, 
	requestPasswordReset, 
	resetPassword, 
	verifyEmail, 
	resendVerificationEmail 
} from '../controllers/authController';
import { getPublicKeyPem, getKeyFingerprint } from '../security/keys';
import requireAuth from '../middleware/requireAuth';

const router = express.Router();

// Route for user registration
router.post('/register', register);

// Route for user login
router.post('/login', login);

// Public key for client-side password encryption
router.get('/public-key', (_req, res) => {
	res.set('Cache-Control', 'no-store');
	res.json({ publicKey: getPublicKeyPem(), fingerprint: getKeyFingerprint() });
});

// Route for getting user profile
router.get('/me', requireAuth, getUserProfile);

// Password reset routes
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Email verification routes
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

export default router;