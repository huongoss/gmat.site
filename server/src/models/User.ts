import mongoose, { Document, Schema } from 'mongoose';

interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    subscriptionActive: boolean;
    practiceResults: Array<{
        testId: string;
        score: number;
        date: Date;
    }>;
}

const UserSchema: Schema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    subscriptionActive: { type: Boolean, default: false },
    practiceResults: [{
        testId: { type: String, required: true },
        score: { type: Number, required: true },
        date: { type: Date, default: Date.now }
    }]
});

const User = mongoose.model<IUser>('User', UserSchema);

export { User, IUser };