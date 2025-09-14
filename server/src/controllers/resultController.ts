import { Request, Response } from 'express';
import Result from '../models/Result';

// Create a new result entry for a user
export const createResult = async (req: Request, res: Response) => {
    const { userId, score, questionsAnswered, correctAnswers } = req.body as {
        userId: string;
        score: number;
        questionsAnswered: number;
        correctAnswers: number;
    };

    try {
        const result = new Result({
            userId,
            score,
            questionsAnswered,
            correctAnswers,
            dateTaken: new Date(),
        });

        await result.save();
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error saving result', error });
    }
};

// Get all results for a specific user
export const getUserResults = async (req: Request, res: Response) => {
    const { userId } = req.params as { userId: string };

    try {
        const results = await Result.find({ userId }).lean();
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching results', error });
    }
};

// Get a specific result by ID
export const getResultById = async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    try {
        const result = await Result.findById(id).lean();
        if (!result) {
            return res.status(404).json({ message: 'Result not found' });
        }
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching result', error });
    }
};