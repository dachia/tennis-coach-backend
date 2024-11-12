import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface ICoachTrainee extends Document {
  coachId: mongoose.Types.ObjectId;
  traineeId: mongoose.Types.ObjectId;
  coach: IUser;
  trainee: IUser;
}

const coachTraineeSchema = new Schema({
  coachId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  traineeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    unique: true // Each trainee can only have one coach
  }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

coachTraineeSchema.virtual('trainee', {
  ref: 'User',
  localField: 'traineeId',
  foreignField: '_id',
  justOne: true
});

coachTraineeSchema.virtual('coach', {
  ref: 'User',
  localField: 'coachId',
  foreignField: '_id',
  justOne: true
});

export const CoachTrainee = mongoose.model<ICoachTrainee>('CoachTrainee', coachTraineeSchema); 