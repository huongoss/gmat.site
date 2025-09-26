import mongoose, { Document, Schema } from 'mongoose';

interface IUser extends Document {
    username?: string;
    email: string;
    password: string;
    emailVerified: boolean;
    emailVerificationToken?: string;
    emailVerificationExpires?: Date;
    subscriptionActive: boolean;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionCurrentPeriodEnd?: Date;
    practiceResults: Array<{
        testId: string;
        score: number;
        date: Date;
    }>;
    // Simple progress tracking for free users: x/100 questions completed
    currentQuestionIndex: number; // 0-99 for free users (tracks progress)
    lastDailyDate?: Date; // When user last completed daily practice
}

const UserSchema: Schema = new Schema({
    username: { type: String, required: false, unique: true, sparse: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    subscriptionActive: { type: Boolean, default: false },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    subscriptionCurrentPeriodEnd: { type: Date },
    practiceResults: [{
        testId: { type: String, required: true },
        score: { type: Number, required: true },
        date: { type: Date, default: Date.now }
    }],
    // Simple progress tracking for free users: x/100 questions completed
    currentQuestionIndex: { type: Number, default: 0 }, // 0-99 for free users
    lastDailyDate: { type: Date }, // When user last completed daily practice
}, { timestamps: true });

const User = mongoose.model<IUser>('User', UserSchema);

export { User, IUser };