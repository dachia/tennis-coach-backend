import mongoose, { Schema, Document } from 'mongoose';
import { RecurrenceType, WeekDay } from '../../shared/types';

export interface IPlan extends Document {
  _id: mongoose.Types.ObjectId;
  traineeId: mongoose.Types.ObjectId;
  coachId?: mongoose.Types.ObjectId;
  templateId?: mongoose.Types.ObjectId;
  exerciseId?: mongoose.Types.ObjectId;
  name: string;
  recurrenceType: RecurrenceType;
  weekDays?: WeekDay[];
  startDate: Date;
  endDate?: Date;
  traineeName: string;
  traineeEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema({
  traineeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingTemplate'
  },
  exerciseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  recurrenceType: {
    type: String,
    enum: Object.values(RecurrenceType),
    required: true
  },
  weekDays: [{
    type: String,
    enum: Object.values(WeekDay)
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  traineeName: {
    type: String,
    required: true
  },
  traineeEmail: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export const Plan = mongoose.model<IPlan>('Plan', planSchema); 