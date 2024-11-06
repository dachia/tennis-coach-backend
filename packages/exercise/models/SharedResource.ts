import mongoose, { Schema, Document } from 'mongoose';
import { ResourceType } from '../types';

export interface ISharedResource extends Document {
  _id: mongoose.Types.ObjectId;
  resourceType: ResourceType;
  resourceId: mongoose.Types.ObjectId;
  sharedWithId: mongoose.Types.ObjectId;
  sharedById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const sharedResourceSchema = new Schema({
  resourceType: { 
    type: String, 
    enum: Object.values(ResourceType),
    required: true 
  },
  resourceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    refPath: 'resourceType'
  },
  sharedWithId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  sharedById: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  }
}, { timestamps: true });

export const SharedResource = mongoose.model<ISharedResource>('SharedResource', sharedResourceSchema); 