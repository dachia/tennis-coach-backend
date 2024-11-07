import mongoose, { Schema, Document } from 'mongoose';
import { ExerciseLogStatus } from '../types';

export interface IExerciseLog extends Document {
  workoutId: mongoose.Types.ObjectId;
  exerciseId: mongoose.Types.ObjectId;
  kpiId: mongoose.Types.ObjectId;
  traineeId: mongoose.Types.ObjectId;
  logDate: Date;
  actualValue: number;
  status: ExerciseLogStatus;
  notes?: string;
  media?: string[];
}

const exerciseLogSchema = new Schema({
  workoutId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Workout',
    required: true 
  },
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
  traineeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  logDate: { type: Date, required: true },
  actualValue: { type: Number, required: true },
  status: { 
    type: String, 
    enum: Object.values(ExerciseLogStatus),
    default: ExerciseLogStatus.PENDING,
    required: true 
  },
  notes: { type: String },
  media: [{ type: String }]
}, { timestamps: true });

export const ExerciseLog = mongoose.model<IExerciseLog>('ExerciseLog', exerciseLogSchema); 