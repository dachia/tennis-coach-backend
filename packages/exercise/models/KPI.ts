import mongoose, { Schema, Document } from 'mongoose';
import { PerformanceGoal } from '../types';

export interface IKPI extends Document {
  _id: mongoose.Types.ObjectId;
  exerciseId: mongoose.Types.ObjectId;
  goalValue?: number;
  unit: string;
  performanceGoal?: PerformanceGoal;
}

const kpiSchema = new Schema({
  exerciseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Exercise',
    required: true 
  },
  goalValue: { type: Number, required: false },
  unit: { type: String, required: true },
  performanceGoal: { 
    type: String, 
    enum: Object.values(PerformanceGoal),
    required: false 
  }
}, { timestamps: true });

export const KPI = mongoose.model<IKPI>('KPI', kpiSchema); 