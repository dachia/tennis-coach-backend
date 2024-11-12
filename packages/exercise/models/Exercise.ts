import mongoose, { Schema, Document } from 'mongoose';
import { IKPI } from './KPI';

export interface IExercise extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  media: string[];
  createdBy: mongoose.Types.ObjectId;
  kpis?: IKPI[];
  tags?: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const exerciseSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  media: [{ type: String }],
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true 
  },
  tags: [{ type: String, default: [] }],
  isArchived: { type: Boolean, default: false }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

exerciseSchema.virtual('kpis', {
  ref: 'KPI',
  localField: '_id',
  foreignField: 'exerciseId'
});

export const Exercise = mongoose.model<IExercise>('Exercise', exerciseSchema); 