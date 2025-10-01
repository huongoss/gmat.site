import express from 'express';
import { getQuestions, submitAnswers, getDailyQuestions, submitDailyAnswers, getUserProgress } from '../controllers/testController';
import requireAuth from '../middleware/requireAuth';

const router = express.Router();

// Trial questions: allow public access (10 questions)
router.get('/questions', getQuestions);

// Submit answers and get results: require auth
router.post('/submit', requireAuth, submitAnswers);

// Daily practice (authenticated)
router.get('/daily', requireAuth, getDailyQuestions);
router.post('/daily/submit', requireAuth, submitDailyAnswers);
router.get('/daily/progress', requireAuth, getUserProgress);

export default router;