import express from 'express';
import { getQuestions, submitAnswers, getDailyQuestions, submitDailyAnswers, getUserProgress, getUserResults } from '../controllers/testController';
import requireAuth from '../middleware/requireAuth';

const router = express.Router();

// Trial questions: allow public access (10 questions)
router.get('/questions', getQuestions);

// Submit answers and get results: require auth
router.post('/submit', requireAuth, submitAnswers);

// Daily practice endpoints
router.get('/daily', requireAuth, getDailyQuestions);
router.post('/daily/submit', requireAuth, submitDailyAnswers);

// User progress endpoint
router.get('/progress', requireAuth, getUserProgress);

export default router;