import mongoose, { Schema, Document } from 'mongoose';

export interface ITotalProgress extends Document {
  _id: mongoose.Types.ObjectId;
  exerciseId: mongoose.Types.ObjectId;
  kpiId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  progressValue: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const totalProgressSchema = new Schema({
  exerciseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Exercise',
    required: true 
  },
  kpiId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'KPI',
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  progressValue: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true }
}, { timestamps: true });

export const TotalProgress = mongoose.model<ITotalProgress>('TotalProgress', totalProgressSchema); 