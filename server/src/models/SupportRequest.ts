import { Schema, model, Document } from 'mongoose';

export interface ISupportRequest extends Document {
  name: string;
  email: string;
  message: string;
  status: 'new' | 'in_progress' | 'closed';
  referenceId: string; // short id returned to user for tracking
  userId?: string; // optional if authenticated user submitted (future enhancement)
  createdAt: Date;
  updatedAt: Date;
  respondedAt?: Date;
}

const SupportRequestSchema = new Schema<ISupportRequest>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, index: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['new', 'in_progress', 'closed'], default: 'new', index: true },
  referenceId: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  respondedAt: { type: Date }
}, { timestamps: true });

export const SupportRequest = model<ISupportRequest>('SupportRequest', SupportRequestSchema);

export default SupportRequest;
