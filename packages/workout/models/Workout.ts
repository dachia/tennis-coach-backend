import mongoose, { Schema, Document } from 'mongoose';
import { WorkoutStatus } from '../types';

export interface IWorkout extends Document {
  _id: mongoose.Types.ObjectId;
  traineeId: mongoose.Types.ObjectId;
  name: string;
  startTimestamp: Date;
  endTimestamp?: Date;
  status: WorkoutStatus;
  templateId?: mongoose.Types.ObjectId;
  notes?: string;
  media?: string[];
  exerciseLogs?: any[];
}

const workoutSchema = new Schema({
  traineeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  startTimestamp: { 
    type: Date, 
    required: true,
    default: Date.now 
  },
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
}, { 
  timestamps: true,
  toJSON: { virtuals: true }
});

workoutSchema.virtual('exerciseLogs', {
  ref: 'ExerciseLog',
  localField: '_id',
  foreignField: 'workoutId'
});

export const Workout = mongoose.model<IWorkout>('Workout', workoutSchema); 