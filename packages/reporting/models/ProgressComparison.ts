import mongoose, { Schema, Document } from 'mongoose';

export interface IProgressComparison extends Document {
  _id: mongoose.Types.ObjectId;
  logId: mongoose.Types.ObjectId;
  kpiId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  comparisonValue: number;
  comparisonDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const progressComparisonSchema = new Schema({
  kpiId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'KPI',
    required: true 
  },
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