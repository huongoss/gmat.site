import express from 'express';
import { 
    register, 
    login, 
    getUserProfile, 
    verifyEmail, 
    resendVerificationEmail,
    requestPasswordReset,
    resetPassword
} from '../controllers/authController';
import requireAuth from '../middleware/requireAuth';
import { validateRegistration, validateLogin, handleValidationErrors } from '../utils/validation';

const router = express.Router();

// Route for user registration
router.post('/register', validateRegistration, handleValidationErrors, register);

// Route for user login
router.post('/login', validateLogin, handleValidationErrors, login);

// Route for getting user profile
router.get('/me', requireAuth, getUserProfile);

// Email verification routes
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Password reset routes
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

export default router;