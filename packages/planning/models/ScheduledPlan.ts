import mongoose, { Schema, Document } from 'mongoose';

export interface IScheduledPlan extends Document {
  _id: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  scheduledDate: Date;
  scheduledBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const scheduledPlanSchema = new Schema({
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
scheduledPlanSchema.index({ scheduledDate: 1 });
scheduledPlanSchema.index({ planId: 1 });

export const ScheduledPlan = mongoose.model<IScheduledPlan>('ScheduledPlan', scheduledPlanSchema); 