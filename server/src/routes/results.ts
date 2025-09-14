import { Router } from 'express';
import { getUserResults, createResult } from '../controllers/resultController';
import requireAuth from '../middleware/requireAuth';

const router = Router();

// Route to get results for a specific user
router.get('/:userId', requireAuth, getUserResults);

// Route to save a user's test result
router.post('/', requireAuth, createResult);

export default router;