import { Request, Response } from 'express';
import Question from '../models/Question';
import Result from '../models/Result';
import { User } from '../models/User';

const FREE_BANK_SIZE = 100;
const PRO_BANK_SIZE = 1000;
const FREE_ALLOCATION_COUNT = 2;
const PRO_ALLOCATION_COUNT = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

function hoursSince(date?: Date | null) {
    if (!date) return Number.POSITIVE_INFINITY;
    return (Date.now() - new Date(date).getTime()) / (60 * 60 * 1000);
}

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

export const getDailyQuestions = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any)?.id as string | undefined;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isPro = !!user.subscriptionActive;
        const questionsPerDay = isPro ? 10 : 2;
        const bankSize = isPro ? 1000 : 100;

        // Check if user has already completed practice today (not just got questions)
        const today = new Date().toDateString();
        const lastPracticeCompleted = user.lastDailyDate ? user.lastDailyDate.toDateString() : null;
        
        if (lastPracticeCompleted === today && !isPro) {
            return res.status(200).json({ 
                message: 'You have already completed today\'s practice. Come back tomorrow!', 
                questions: [], 
                canPractice: false,
                progress: user.currentQuestionIndex || 0,
                totalQuestions: bankSize,
                plan: 'free'
            });
        }

        // For users: serve next questions sequentially from current progress
        let startIndex = user.currentQuestionIndex || 0;
        
        // Reset to beginning if completed all questions
        if (startIndex >= bankSize) {
            startIndex = 0;
            user.currentQuestionIndex = 0;
            await user.save();
        }

        // Get questions from database
        const questions = await Question.find({}, { questionText: 1, options: 1, correctAnswer: 1 })
            .sort({ _id: 1 })
            .skip(startIndex)
            .limit(questionsPerDay)
            .lean();

        if (questions.length === 0) {
            return res.status(200).json({
                message: 'No questions available at this time',
                questions: [],
                canPractice: false,
                progress: startIndex,
                totalQuestions: bankSize,
                plan: isPro ? 'pro' : 'free'
            });
        }

        const payload = questions.map((q, index) => ({
            id: String((q as any)._id),
            question: q.questionText,
            options: (q.options || []).map((text: string, idx: number) => ({ 
                id: String.fromCharCode(97 + idx), 
                text 
            })),
            sequenceNumber: startIndex + index + 1 // Show user which question number this is (1-100)
        }));

        return res.status(200).json({ 
            questions: payload, 
            plan: isPro ? 'pro' : 'free',
            progress: startIndex,
            totalQuestions: bankSize,
            canPractice: true
        });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching daily questions', error });
    }
};

// Submit daily practice answers and update progress
export const submitDailyAnswers = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any)?.id as string | undefined;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { answers } = req.body as { answers: Record<string, string> };
        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({ message: 'Invalid answers format' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const questionIds = Object.keys(answers);
        const questionsPerDay = user.subscriptionActive ? 10 : 2;

        // Get the questions with correct answers
        const questions = await Question.find({ _id: { $in: questionIds } }).lean();
        if (questions.length !== questionIds.length) {
            return res.status(400).json({ message: 'Some questions not found' });
        }

        // Calculate score
        let correctAnswers = 0;
        const feedback: Array<{ questionId: string, correct: boolean, correctAnswer: string, userAnswer: string }> = [];

        questions.forEach((question: any) => {
            const questionId = String(question._id);
            const userAnswer = answers[questionId];
            const correctAnswer = question.correctAnswer;
            const isCorrect = userAnswer === correctAnswer;
            
            if (isCorrect) correctAnswers++;
            
            feedback.push({
                questionId,
                correct: isCorrect,
                correctAnswer,
                userAnswer
            });
        });

        const score = Math.round((correctAnswers / questions.length) * 100);

        // Save result to database
        const result = new Result({
            userId,
            score,
            questionsAnswered: questions.length,
            correctAnswers,
            type: 'daily',
            questionIds,
            userAnswers: answers,
            dateTaken: new Date()
        });
        await result.save();

        // Update user progress
        user.currentQuestionIndex = (user.currentQuestionIndex || 0) + questionsPerDay;
        user.lastDailyDate = new Date();
        await user.save();

        return res.status(200).json({
            message: 'Daily practice submitted successfully',
            score,
            correctAnswers,
            totalQuestions: questions.length,
            feedback,
            progress: user.currentQuestionIndex,
            totalInBank: user.subscriptionActive ? 1000 : 100
        });

    } catch (error) {
        res.status(500).json({ message: 'Error submitting daily answers', error });
    }
};

// Get user's progress and practice history
export const getUserProgress = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any)?.id as string | undefined;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Get daily practice history
        const dailyHistory = await Result.find({ 
            userId, 
            type: 'daily' 
        }).sort({ dateTaken: -1 }).limit(10);

        const isPro = !!user.subscriptionActive;
        const totalQuestions = isPro ? 1000 : 100;
        const currentProgress = user.currentQuestionIndex || 0;

        return res.status(200).json({
            progress: {
                current: currentProgress,
                total: totalQuestions,
                percentage: Math.round((currentProgress / totalQuestions) * 100)
            },
            canPracticeToday: user.lastDailyDate ? 
                user.lastDailyDate.toDateString() !== new Date().toDateString() : true,
            lastPracticeDate: user.lastDailyDate,
            dailyHistory: dailyHistory.map(result => ({
                date: result.dateTaken,
                score: result.score,
                correctAnswers: result.correctAnswers,
                totalQuestions: result.questionsAnswered
            })),
            plan: isPro ? 'pro' : 'free'
        });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching user progress', error });
    }
};