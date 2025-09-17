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
    questionProgress?: {
        free?: {
            servedQuestionIds: string[];
            currentQuestionIds?: string[];
            lastAllocatedAt?: Date;
        };
        pro?: {
            index: number;
            currentQuestionIds?: string[];
            lastAllocatedAt?: Date;
        };
    };
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
    questionProgress: {
        type: new Schema(
            {
                free: new Schema(
                    {
                        servedQuestionIds: { type: [String], default: [] },
                        currentQuestionIds: { type: [String], default: [] },
                        lastAllocatedAt: { type: Date },
                    },
                    { _id: false }
                ),
                pro: new Schema(
                    {
                        index: { type: Number, default: 0 },
                        currentQuestionIds: { type: [String], default: [] },
                        lastAllocatedAt: { type: Date },
                    },
                    { _id: false }
                ),
            },
            { _id: false }
        ),
        default: {},
    },
}, { timestamps: true });

const User = mongoose.model<IUser>('User', UserSchema);

export { User, IUser };