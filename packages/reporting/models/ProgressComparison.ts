import mongoose, { Schema, Document } from 'mongoose';
import { PerformanceGoal } from '../../shared/constants/PerformanceGoal';

export interface IProgressComparison extends Document {
  _id: mongoose.Types.ObjectId;
  logId: mongoose.Types.ObjectId;
  exerciseId: mongoose.Types.ObjectId;
  kpiId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  kpiUnit: string;
  kpiPerformanceGoal: PerformanceGoal;
  comparisonValue: number;
  comparisonPercent: number;
  comparisonDate: Date;
  logDate: Date;
  actualValue: number;
  createdAt: Date;
  updatedAt: Date;
}

const progressComparisonSchema = new Schema({
  kpiId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'KPI',
    required: true 
  },
  exerciseId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
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
  kpiUnit: { type: String, required: true },
  kpiPerformanceGoal: { type: String, enum: PerformanceGoal, required: true },
  comparisonValue: { type: Number, required: true },
  comparisonPercent: { type: Number, required: true },
  comparisonDate: { type: Date, default: Date.now, required: true },
  logDate: { type: Date, required: true },
  actualValue: { type: Number, required: true }
}, { timestamps: true });

export const ProgressComparison = mongoose.model<IProgressComparison>('ProgressComparison', progressComparisonSchema); 