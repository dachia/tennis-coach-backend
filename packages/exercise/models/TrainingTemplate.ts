import mongoose, { Schema, Document } from 'mongoose';

export interface ITrainingTemplate extends Document {
  title: string;
  description: string;
  createdBy: mongoose.Types.ObjectId;
  exerciseIds: mongoose.Types.ObjectId[];
}

const trainingTemplateSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  exerciseIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Exercise' 
  }]
}, { timestamps: true });

export const TrainingTemplate = mongoose.model<ITrainingTemplate>('TrainingTemplate', trainingTemplateSchema); 