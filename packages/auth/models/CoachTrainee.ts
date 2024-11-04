import mongoose, { Schema, Document } from 'mongoose';

export interface ICoachTrainee extends Document {
  coachId: mongoose.Types.ObjectId;
  traineeId: mongoose.Types.ObjectId;
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
}, { timestamps: true });

export const CoachTrainee = mongoose.model<ICoachTrainee>('CoachTrainee', coachTraineeSchema); 