import { Schema, model, Document } from 'mongoose';

interface IQuestion extends Document {
    questionText: string;
    options: string[];
    correctAnswer: string;
}

const questionSchema = new Schema<IQuestion>({
    questionText: { type: String, required: true },
    options: { type: [String], required: true },
    correctAnswer: { type: String, required: true }
});

const Question = model<IQuestion>('Question', questionSchema);

export default Question;