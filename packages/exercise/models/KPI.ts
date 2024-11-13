import mongoose, { Schema, Document } from 'mongoose';
import { PerformanceGoal } from "../../shared/constants/PerformanceGoal";

export interface IKPI extends Document {
  _id: mongoose.Types.ObjectId;
  exerciseId: mongoose.Types.ObjectId;
  unit: string;
  performanceGoal?: PerformanceGoal;
  tags?: string[];
}

const kpiSchema = new Schema({
  exerciseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Exercise',
    required: true 
  },
  unit: { type: String, required: true },
  performanceGoal: { 
    type: String, 
    enum: Object.values(PerformanceGoal),
    required: true 
  },
  tags: [{ type: String, default: [] }]
}, { timestamps: true });

export const KPI = mongoose.model<IKPI>('KPI', kpiSchema); 