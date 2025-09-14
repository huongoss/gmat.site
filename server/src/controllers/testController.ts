import { Request, Response } from 'express';
import Question from '../models/Question';
import Result from '../models/Result';
import { User } from '../models/User';

// Get a list of questions for the GMAT test (trial: 10 questions)
export const getQuestions = async (_req: Request, res: Response) => {
    try {
        const questions = await Question.find().limit(10);
        res.status(200).json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching questions', error });
    }
};

// Submit answers and check results
export const submitAnswers = async (req: Request, res: Response) => {
    const { userId, answers } = req.body as { userId: string; answers: Record<string, string> };

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const qIds = Object.keys(answers || {});
        const qs = await Question.find({ _id: { $in: qIds } });
        let score = 0;

        qs.forEach((question) => {
            // correctAnswer stores option id (e.g., 'a')
            if (question.correctAnswer === answers[String(question._id)]) {
                score++;
            }
        });

        const result = new Result({
            userId,
            score,
            questionsAnswered: qs.length,
            correctAnswers: score,
            dateTaken: new Date(),
        });

        await result.save();

        res.status(200).json({ score, totalQuestions: qs.length });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting answers', error });
    }
};

// Get user's past results
export const getUserResults = async (req: Request, res: Response) => {
    const { userId } = req.params as { userId: string };

    try {
        const results = await Result.find({ userId }).lean();
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching results', error });
    }
};