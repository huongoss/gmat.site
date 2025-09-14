import express from 'express';
import { register, login, getUserProfile } from '../controllers/authController';
import requireAuth from '../middleware/requireAuth';

const router = express.Router();

// Route for user registration
router.post('/register', register);

// Route for user login
router.post('/login', login);

// Route for getting user profile
router.get('/me', requireAuth, getUserProfile);

export default router;