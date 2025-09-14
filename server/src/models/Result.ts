import { Schema, model, Document } from 'mongoose';

interface IResult extends Document {
    userId: string;
    score: number;
    questionsAnswered: number;
    correctAnswers: number;
    dateTaken: Date;
}

const ResultSchema = new Schema<IResult>({
    userId: { type: String, required: true },
    score: { type: Number, required: true },
    questionsAnswered: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    dateTaken: { type: Date, default: Date.now }
});

const Result = model<IResult>('Result', ResultSchema);

export default Result;