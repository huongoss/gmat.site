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
        const bankSize = isPro ? PRO_BANK_SIZE : FREE_BANK_SIZE;
        const allocationCount = isPro ? PRO_ALLOCATION_COUNT : FREE_ALLOCATION_COUNT;
        const intervalHours = isPro ? 24 : 48;

        // Build bank: first N questions in stable order
        const bank = await Question.find({}, { questionText: 1, options: 1 })
            .sort({ _id: 1 })
            .limit(bankSize)
            .lean();
        const bankIds = bank.map((q) => String((q as any)._id));

        // Ensure progress structure
        user.questionProgress = user.questionProgress || {};
        if (isPro) user.questionProgress.pro = user.questionProgress.pro || { index: 0, currentQuestionIds: [] } as any;
        else user.questionProgress.free = user.questionProgress.free || { servedQuestionIds: [], currentQuestionIds: [] } as any;

        if (!isPro) {
            const free = user.questionProgress.free! as any;
            const fresh = hoursSince(free.lastAllocatedAt) < intervalHours && (free.currentQuestionIds?.length || 0) > 0;
            let selectedIds: string[] = [];
            if (fresh) {
                selectedIds = free.currentQuestionIds.slice();
            } else {
                // pick randomly from remaining in bank
                const served = new Set<string>(free.servedQuestionIds || []);
                let candidates = bankIds.filter((id) => !served.has(id));
                if (candidates.length < allocationCount) {
                    // reset served if exhausted
                    served.clear();
                    candidates = bankIds.slice();
                    free.servedQuestionIds = [];
                }
                // random shuffle simple
                for (let i = candidates.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
                }
                selectedIds = candidates.slice(0, allocationCount);
                free.currentQuestionIds = selectedIds;
                free.lastAllocatedAt = new Date();
                free.servedQuestionIds = Array.from(new Set([...(free.servedQuestionIds || []), ...selectedIds]));
                await user.save();
            }

            const selected = bank.filter((q) => selectedIds.includes(String((q as any)._id)));
            const payload = selected.map((q) => ({
                id: String((q as any)._id),
                question: q.questionText,
                options: (q.options || []).map((text: string, idx: number) => ({ id: String.fromCharCode(97 + idx), text })),
            }));
            return res.status(200).json({ questions: payload, plan: 'free', next_allocation_in_hours: Math.max(0, intervalHours - hoursSince(user.questionProgress.free!.lastAllocatedAt || undefined)) });
        } else {
            const pro = user.questionProgress.pro! as any;
            const fresh = hoursSince(pro.lastAllocatedAt) < intervalHours && (pro.currentQuestionIds?.length || 0) > 0;
            let selectedIds: string[] = [];
            if (fresh) {
                selectedIds = pro.currentQuestionIds.slice();
            } else {
                const start = Math.min(pro.index || 0, bankIds.length);
                const end = Math.min(start + allocationCount, bankIds.length);
                selectedIds = bankIds.slice(start, end);
                pro.currentQuestionIds = selectedIds;
                pro.lastAllocatedAt = new Date();
                pro.index = end; // advance progress; cap at bank end
                await user.save();
            }

            const selected = bank.filter((q) => selectedIds.includes(String((q as any)._id)));
            const payload = selected.map((q) => ({
                id: String((q as any)._id),
                question: q.questionText,
                options: (q.options || []).map((text: string, idx: number) => ({ id: String.fromCharCode(97 + idx), text })),
            }));
            return res.status(200).json({ questions: payload, plan: 'pro', next_allocation_in_hours: Math.max(0, intervalHours - hoursSince(user.questionProgress.pro!.lastAllocatedAt || undefined)) });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching daily questions', error });
    }
};