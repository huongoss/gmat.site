import express from 'express';
import { getQuestions, submitAnswers } from '../controllers/testController';
import requireAuth from '../middleware/requireAuth';

const router = express.Router();

// Trial questions: allow public access (10 questions)
router.get('/questions', getQuestions);

// Submit answers and get results: require auth
router.post('/submit', requireAuth, submitAnswers);

export default router;