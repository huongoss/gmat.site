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

        // Allow unverified users to attempt the first daily set; verification will be encouraged post-result.
    // Admins receive pro entitlements (question count & bank size)
    const isPro = !!(user.subscriptionActive || (user as any).admin);
        const maxDaily = isPro ? 10 : 2;
        const bankSize = isPro ? 1000 : 100;
        const todayKey = new Date().toDateString();

        // If user already submitted today (lastDailyDate marks completion), block further practice
        if (user.lastDailyDate && user.lastDailyDate.toDateString() === todayKey) {
            return res.status(200).json({
                message: 'Daily practice already completed. Come back tomorrow!',
                questions: [],
                canPractice: false,
                progress: user.currentQuestionIndex || 0,
                totalQuestions: bankSize,
                plan: isPro ? 'pro' : 'free'
            });
        }

        // Allow manual reset for debugging (e.g., /api/daily?forceReset=1) - only in non-production if needed
        const forceReset = req.query.forceReset === '1';

        // Reset daily allocation if date changed OR force reset
        if (forceReset || !user.dailyQuestionsDate || user.dailyQuestionsDate.toDateString() !== todayKey) {
            user.dailyQuestionIds = [];
            user.dailyQuestionCount = 0;
            // Don't set dailyQuestionsDate yet; wait until we successfully allocate to avoid a stale date with zero questions
        }

        // If already allocated full quota, return same set (or none if none allocated - should not happen)
        if (user.dailyQuestionCount && user.dailyQuestionCount >= maxDaily) {
            if (!user.dailyQuestionIds || user.dailyQuestionIds.length === 0) {
                return res.status(200).json({
                    message: 'Daily quota reached',
                    questions: [],
                    canPractice: false,
                    progress: user.currentQuestionIndex || 0,
                    totalQuestions: bankSize,
                    plan: isPro ? 'pro' : 'free'
                });
            }
            // Re-fetch the stored questions to return consistent payload
            const storedQs = await Question.find({ _id: { $in: user.dailyQuestionIds } }, { questionText: 1, options: 1, correctAnswer: 1 }).lean();
            const payloadStored = storedQs.map((q: any) => ({
                id: String(q._id),
                question: q.questionText,
                options: (q.options || []).map((text: string, idx: number) => ({ id: String.fromCharCode(97 + idx), text })),
                sequenceNumber: undefined // sequence not critical for repeated view
            }));
            return res.status(200).json({
                message: 'Daily quota already allocated',
                questions: payloadStored,
                canPractice: true,
                progress: user.currentQuestionIndex || 0,
                totalQuestions: bankSize,
                plan: isPro ? 'pro' : 'free'
            });
        }

        // Determine how many to allocate now
        const remaining = maxDaily - (user.dailyQuestionCount || 0);
        const toAllocate = Math.min(remaining, maxDaily); // allocate remainder

        // Determine start index for sequential progression across the bank
        let startIndex = user.currentQuestionIndex || 0;
        if (startIndex >= bankSize) {
            startIndex = 0;
            user.currentQuestionIndex = 0;
        }

        const newQuestions = await Question.find({}, { questionText: 1, options: 1, correctAnswer: 1 })
            .sort({ _id: 1 })
            .skip(startIndex)
            .limit(toAllocate)
            .lean();

        if (newQuestions.length === 0) {
            // If we reached here with no questions it's likely the bank is empty OR startIndex exceeded actual documents.
            // Add a defensive check: count total questions to help diagnose.
            const totalInDB = await Question.countDocuments();
            // If startIndex beyond totalInDB, wrap and try again once.
            if (startIndex >= totalInDB && totalInDB > 0) {
                const retryQuestions = await Question.find({}, { questionText: 1, options: 1, correctAnswer: 1 })
                    .sort({ _id: 1 })
                    .limit(toAllocate)
                    .lean();
                if (retryQuestions.length > 0) {
                    const retryIds = retryQuestions.map(q => String((q as any)._id));
                    user.dailyQuestionIds = retryIds;
                    user.dailyQuestionCount = retryQuestions.length;
                    user.dailyQuestionsDate = new Date();
                    await user.save();
                    const retryPayload = retryQuestions.map((q: any, idx: number) => ({
                        id: String(q._id),
                        question: q.questionText,
                        options: (q.options || []).map((text: string, oIdx: number) => ({ id: String.fromCharCode(97 + oIdx), text })),
                        sequenceNumber: idx + 1
                    }));
                    return res.status(200).json({
                        questions: retryPayload,
                        plan: isPro ? 'pro' : 'free',
                        progress: user.currentQuestionIndex || 0,
                        totalQuestions: bankSize,
                        canPractice: true,
                        allocated: user.dailyQuestionCount,
                        remaining: maxDaily - (user.dailyQuestionCount || 0),
                        note: 'Wrapped to start of bank after index overflow'
                    });
                }
            }

            // Persist reset state only (no date) and inform client.
            await user.save();
            return res.status(200).json({
                message: 'No questions available at this time',
                questions: [],
                canPractice: false,
                progress: startIndex,
                totalQuestions: bankSize,
                plan: isPro ? 'pro' : 'free',
                diagnostics: { totalInDB, startIndex, toAllocate }
            });
        }

        const newIds = newQuestions.map(q => String((q as any)._id));
        user.dailyQuestionIds = [...(user.dailyQuestionIds || []), ...newIds];
        user.dailyQuestionCount = (user.dailyQuestionCount || 0) + newQuestions.length;
        // Only now set the date to mark that allocation for today exists
        if (!user.dailyQuestionsDate || user.dailyQuestionsDate.toDateString() !== todayKey) {
            user.dailyQuestionsDate = new Date();
        }
        // Do NOT advance currentQuestionIndex until submission, to preserve scoring order
        await user.save();

        const payload = newQuestions.map((q: any, idx: number) => ({
            id: String(q._id),
            question: q.questionText,
            options: (q.options || []).map((text: string, oIdx: number) => ({ id: String.fromCharCode(97 + oIdx), text })),
            sequenceNumber: startIndex + idx + 1
        }));

        return res.status(200).json({
            questions: payload,
            plan: isPro ? 'pro' : 'free',
            progress: user.currentQuestionIndex || 0,
            totalQuestions: bankSize,
            canPractice: true,
            allocated: user.dailyQuestionCount,
            remaining: maxDaily - (user.dailyQuestionCount || 0)
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

        // Allow unverified users to submit; client will prompt verification to unlock detailed review.
    const questionIds = Object.keys(answers);
    const isPro = !!(user.subscriptionActive || (user as any).admin);

        // Enforce answering only today's allocated questions
        if (!user.dailyQuestionIds || user.dailyQuestionIds.length === 0) {
            return res.status(400).json({ message: 'No daily questions allocated for today' });
        }
        const allocatedSet = new Set(user.dailyQuestionIds);
        for (const qid of questionIds) {
            if (!allocatedSet.has(qid)) {
                return res.status(400).json({ message: 'Attempting to submit answers for non-allocated daily questions' });
            }
        }

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

        if (user.emailVerified) {
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

            // Update user progress for verified users only
            const maxDailySubmit = isPro ? 10 : 2;
            const increment = user.dailyQuestionIds.length;
            user.currentQuestionIndex = (user.currentQuestionIndex || 0) + increment;
            user.lastDailyDate = new Date(); // mark completion
            user.dailyQuestionCount = maxDailySubmit;
            // Clear allocation after successful submission to avoid re-use and to allow clean fetch tomorrow only
            user.dailyQuestionIds = [];
            // Keep dailyQuestionsDate as the date of allocation; optionally could clear, but leave for reference
            await user.save();

            return res.status(200).json({
                message: 'Daily practice submitted successfully',
                score,
                correctAnswers,
                totalQuestions: questions.length,
                feedback,
                progress: user.currentQuestionIndex,
                totalInBank: isPro ? 1000 : 100,
                saved: true
            });
        } else {
            // Unverified users: do NOT persist results or advance progress; keep same allocation
            return res.status(200).json({
                message: 'Daily practice completed (not saved). Verify your email to unlock detailed results and saved progress.',
                score,
                correctAnswers,
                totalQuestions: questions.length,
                feedback,
                progress: user.currentQuestionIndex || 0,
                totalInBank: isPro ? 1000 : 100,
                saved: false
            });
        }

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

        // Get daily practice history (original daily attempts)
        const dailyHistory = await Result.find({ 
            userId, 
            type: 'daily' 
        }).sort({ dateTaken: -1 }).limit(10);

        // Get recent retake attempts linked to those daily results
        const baseIds = dailyHistory.map(r => String(r._id));
        let retakeHistory: any[] = [];
        if (baseIds.length > 0) {
            retakeHistory = await Result.find({ userId, type: 'daily-retake', baseResultId: { $in: baseIds } })
                .sort({ dateTaken: -1 })
                .limit(50); // cap retake history
        }

    // Admins also get pro progress limits
    const isPro = !!(user.subscriptionActive || (user as any).admin);
        const emailVerified = !!user.emailVerified;
        if (!emailVerified) {
            return res.status(200).json({
                progress: {
                    current: user.currentQuestionIndex || 0,
                    total: isPro ? 1000 : 100,
                    percentage: Math.round(((user.currentQuestionIndex || 0) / (isPro ? 1000 : 100)) * 100)
                },
                canPracticeToday: false,
                emailVerified: false,
                reason: 'Email not verified',
                plan: isPro ? 'pro' : 'free'
            });
        }
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
                id: String(result._id),
                date: result.dateTaken,
                score: result.score,
                correctAnswers: result.correctAnswers,
                totalQuestions: result.questionsAnswered
            })),
            retakeHistory: retakeHistory.map(r => ({
                id: String(r._id),
                baseResultId: r.baseResultId,
                date: r.dateTaken,
                score: r.score,
                correctAnswers: r.correctAnswers,
                totalQuestions: r.questionsAnswered
            })),
            plan: isPro ? 'pro' : 'free'
        });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching user progress', error });
    }
};

// Fetch today's completed daily question set for retake (2 or 10) without changing allocation.
export const getRetakeDailyQuestions = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any)?.id as string | undefined;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Allow unverified users to retrieve retake questions so they can track what they did

        // Find today's original daily result (not a retake)
        const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(); endOfDay.setHours(23,59,59,999);
        const original = await Result.findOne({ userId, type: 'daily', dateTaken: { $gte: startOfDay, $lte: endOfDay } }).lean();
        if (!original) {
            return res.status(404).json({ message: 'No completed daily practice found for today to retake.' });
        }

        const questions = await Question.find({ _id: { $in: original.questionIds } }, { questionText: 1, options: 1, correctAnswer: 1 }).lean();
        const payload = questions.map((q: any, idx: number) => ({
            id: String(q._id),
            question: q.questionText,
            options: (q.options || []).map((text: string, oIdx: number) => ({ id: String.fromCharCode(97 + oIdx), text })),
            sequenceNumber: idx + 1
        }));
        return res.status(200).json({
            questions: payload,
            baseResultId: String((original as any)._id),
            originalScore: original.score,
            count: payload.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching retake daily questions', error });
    }
};

// Submit retake answers (does not affect daily quotas or user progress)
export const submitRetakeDailyAnswers = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any)?.id as string | undefined;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const { answers, baseResultId } = req.body as { answers: Record<string,string>; baseResultId: string };
        if (!answers || typeof answers !== 'object' || !baseResultId) {
            return res.status(400).json({ message: 'Invalid payload' });
        }
    const base = await Result.findOne({ _id: baseResultId, userId, type: 'daily' }).lean();
        if (!base) return res.status(404).json({ message: 'Base daily result not found' });

        const questionIds = Object.keys(answers);
        // Ensure only original question IDs are answered
        for (const qid of questionIds) {
            if (!base.questionIds.includes(qid)) {
                return res.status(400).json({ message: 'Answer includes question not in original set' });
            }
        }
        const questions = await Question.find({ _id: { $in: questionIds } }).lean();
        if (questions.length !== questionIds.length) {
            return res.status(400).json({ message: 'Some questions not found' });
        }
        let correctAnswers = 0;
        const feedback: Array<{ questionId: string; correct: boolean; correctAnswer: string; userAnswer: string }> = [];
        questions.forEach((q: any) => {
            const qid = String(q._id);
            const userAnswer = answers[qid];
            const isCorrect = userAnswer === q.correctAnswer;
            if (isCorrect) correctAnswers++;
            feedback.push({ questionId: qid, correct: isCorrect, correctAnswer: q.correctAnswer, userAnswer });
        });
        const score = Math.round((correctAnswers / questions.length) * 100);
        const result = new Result({
            userId,
            score,
            questionsAnswered: questions.length,
            correctAnswers,
            type: 'daily-retake',
            questionIds: base.questionIds,
            userAnswers: answers,
            baseResultId
        });
        await result.save();
        return res.status(200).json({
            message: 'Retake submitted',
            score,
            correctAnswers,
            totalQuestions: questions.length,
            feedback,
            baseResultId,
            originalScore: base.score
        });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting retake answers', error });
    }
};