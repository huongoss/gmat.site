import { Schema, model, Document } from 'mongoose';

interface IQuestion extends Document {
    questionText: string;
    passage?: string; // optional passage for reading comprehension questions
    options: string[];
    correctAnswer: string;
    type?: string; // e.g., "quantitative", "critical_reasoning", "data_sufficiency", etc.
    category?: string; // e.g., "algebra", "supporting_idea", "evaluation", etc.
    difficulty?: 'easy' | 'medium' | 'hard';
    explanation?: string; // explanation of the correct answer
    verified?: boolean; // whether the question has been AI-verified
}

const questionSchema = new Schema<IQuestion>({
    questionText: { type: String, required: true },
    passage: { type: String, required: false }, // optional passage for reading comprehension
    options: { type: [String], required: true },
    correctAnswer: { type: String, required: true },
    type: { type: String, required: false },
    category: { type: String, required: false },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: false },
    explanation: { type: String, required: false },
    verified: { type: Boolean, required: false, default: false }
});

const Question = model<IQuestion>('Question', questionSchema);

export default Question;