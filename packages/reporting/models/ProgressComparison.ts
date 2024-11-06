import mongoose, { Schema, Document } from 'mongoose';

export interface IProgressComparison extends Document {
  logId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  comparisonValue: number;
  comparisonDate: Date;
}

const progressComparisonSchema = new Schema({
  logId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ExerciseLog',
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  comparisonValue: { type: Number, required: true },
  comparisonDate: { type: Date, default: Date.now, required: true }
}, { timestamps: true });

export const ProgressComparison = mongoose.model<IProgressComparison>('ProgressComparison', progressComparisonSchema); 