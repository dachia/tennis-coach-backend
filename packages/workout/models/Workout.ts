import mongoose, { Schema, Document } from 'mongoose';
import { WorkoutStatus } from '../types';

export interface IWorkout extends Document {
  traineeId: mongoose.Types.ObjectId;
  workoutDate: Date;
  startTimestamp: Date;
  endTimestamp?: Date;
  status: WorkoutStatus;
  templateId?: mongoose.Types.ObjectId;
  notes?: string;
  media?: string[];
}

const workoutSchema = new Schema({
  traineeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  workoutDate: { type: Date, required: true },
  startTimestamp: { type: Date, required: true },
  endTimestamp: { type: Date },
  status: { 
    type: String, 
    enum: Object.values(WorkoutStatus),
    default: WorkoutStatus.PLANNED,
    required: true 
  },
  templateId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingTemplate'
  },
  notes: { type: String },
  media: [{ type: String }]
}, { timestamps: true });

export const Workout = mongoose.model<IWorkout>('Workout', workoutSchema); 