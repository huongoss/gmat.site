import express from 'express';
import { register, login, getUserProfile } from '../controllers/authController';
import requireAuth from '../middleware/requireAuth';
import { validateRegistration, validateLogin, handleValidationErrors } from '../utils/validation';

const router = express.Router();

// Route for user registration
router.post('/register', validateRegistration, handleValidationErrors, register);

// Route for user login
router.post('/login', validateLogin, handleValidationErrors, login);

// Route for getting user profile
router.get('/me', requireAuth, getUserProfile);

export default router;