import mongoose, { Schema, Document } from 'mongoose';
import { ExerciseLogStatus } from '../types';
import { PerformanceGoal } from "../../shared/constants/PerformanceGoal";

export interface IExerciseLog extends Document {
  _id: mongoose.Types.ObjectId;
  workoutId: mongoose.Types.ObjectId;
  exerciseId: mongoose.Types.ObjectId;
  kpiId: mongoose.Types.ObjectId;
  traineeId: mongoose.Types.ObjectId;
  logDate: Date;
  actualValue: number;
  status: ExerciseLogStatus;
  notes?: string;
  media?: string[];
  // Denormalized exercise data
  exerciseTitle: string;
  exerciseDescription: string;
  // Denormalized KPI data
  kpiUnit: string;
  kpiPerformanceGoal: PerformanceGoal;
  kpiTags?: string[];
  createdAt: Date;
  traineeName?: string;
  traineeEmail?: string;
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
  media: [{ type: String }],
  // Denormalized exercise data
  exerciseTitle: { type: String, required: true },
  exerciseDescription: { type: String, required: true },
  // Denormalized KPI data
  kpiUnit: { type: String, required: true },
  kpiPerformanceGoal: { 
    type: String,
    enum: Object.values(PerformanceGoal),
    required: true
  },
  kpiTags: [{ type: String }],
  traineeName: { type: String },
  traineeEmail: { type: String }
}, { timestamps: true });

export const ExerciseLog = mongoose.model<IExerciseLog>('ExerciseLog', exerciseLogSchema); 