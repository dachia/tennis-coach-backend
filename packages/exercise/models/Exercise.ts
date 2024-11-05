import mongoose, { Schema, Document } from 'mongoose';

export interface IExercise extends Document {
  title: string;
  description: string;
  media: string[];
  createdBy: mongoose.Types.ObjectId;
}

const exerciseSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  media: [{ type: String }],
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  }
}, { timestamps: true });

export const Exercise = mongoose.model<IExercise>('Exercise', exerciseSchema); 