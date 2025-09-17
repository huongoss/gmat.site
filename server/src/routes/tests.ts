import express from 'express';
import { getQuestions, submitAnswers, getDailyQuestions } from '../controllers/testController';
import requireAuth from '../middleware/requireAuth';

const router = express.Router();

// Trial questions: allow public access (10 questions)
router.get('/questions', getQuestions);

// Daily allocated questions for logged-in users
router.get('/daily', requireAuth, getDailyQuestions);

// Submit answers and get results: require auth
router.post('/submit', requireAuth, submitAnswers);

export default router;