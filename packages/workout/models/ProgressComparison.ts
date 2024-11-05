import mongoose, { Schema, Document } from 'mongoose';

export interface IProgressComparison extends Document {
  logId: mongoose.Types.ObjectId;
  comparisonValue: number;
}

const progressComparisonSchema = new Schema({
  logId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ExerciseLog',
    required: true 
  },
  comparisonValue: { type: Number, required: true }
}, { timestamps: true });

export const ProgressComparison = mongoose.model<IProgressComparison>('ProgressComparison', progressComparisonSchema); 