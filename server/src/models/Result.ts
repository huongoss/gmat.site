import { Schema, model, Document } from 'mongoose';

interface IResult extends Document {
    userId: string;
    score: number;
    questionsAnswered: number;
    correctAnswers: number;
    dateTaken: Date;
    type: string; // 'daily', 'daily-retake', 'test', 'trial'
    questionIds: string[]; // IDs of questions answered
    userAnswers: Record<string, string>; // user's answers by question ID
    baseResultId?: string; // For retakes, link back to original daily result
}

const ResultSchema = new Schema<IResult>({
    userId: { type: String, required: true },
    score: { type: Number, required: true },
    questionsAnswered: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    dateTaken: { type: Date, default: Date.now },
    type: { type: String, required: true, default: 'test' }, // 'daily', 'daily-retake', 'test', 'trial'
    questionIds: [{ type: String }], // IDs of questions answered
    userAnswers: { type: Map, of: String }, // user's answers by question ID
    baseResultId: { type: String }
});

const Result = model<IResult>('Result', ResultSchema);

export default Result;