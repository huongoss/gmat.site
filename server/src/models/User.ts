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
    dailyQuestionsDate?: Date; // Date for which dailyQuestionIds were allocated
    dailyQuestionIds?: string[]; // IDs of allocated daily questions for that date
    dailyQuestionCount?: number; // Number of daily questions served today (for safety)
    // New daily system (carry-over based)
    dailyCarryOver?: number; // Remaining entitlement slots (including today + accumulated)
    dailyConsumedToday?: number; // How many consumed on the current server day
    dailyLastSubmitDate?: Date; // Date of last submission affecting daily counters
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
    dailyQuestionsDate: { type: Date },
    dailyQuestionIds: { type: [String], default: [] },
    dailyQuestionCount: { type: Number, default: 0 },
    // New daily system
    dailyCarryOver: { type: Number, default: 0 },
    dailyConsumedToday: { type: Number, default: 0 },
    dailyLastSubmitDate: { type: Date },
}, { timestamps: true });

const User = mongoose.model<IUser>('User', UserSchema);

export { User, IUser };