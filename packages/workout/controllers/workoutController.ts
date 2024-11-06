import { Response } from 'express';
import { AuthRequest } from '../../shared/middleware/auth';
import { createResponse } from '../../shared/utils/response.utils';
import { WorkoutService } from '../services/workoutService';

export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  async createWorkout(req: AuthRequest, res: Response) {
    const result = await this.workoutService.createWorkout({
      ...req.body,
      userId: req.user._id
    });
    
    res.status(201).json(
      createResponse('success', 'Workout created successfully', result)
    );
  }

  async createExerciseLog(req: AuthRequest, res: Response) {
    const result = await this.workoutService.createExerciseLog({
      ...req.body,
      userId: req.user._id
    });
    
    res.status(201).json(
      createResponse('success', 'Exercise log created successfully', result)
    );
  }

  async updateWorkout(req: AuthRequest, res: Response) {
    const result = await this.workoutService.updateWorkout(
      req.params.id,
      {
        ...req.body,
        userId: req.user._id
      }
    );
    
    res.json(
      createResponse('success', 'Workout updated successfully', result)
    );
  }

  async updateExerciseLog(req: AuthRequest, res: Response) {
    const result = await this.workoutService.updateExerciseLog(
      req.params.id,
      {
        ...req.body,
        userId: req.user._id
      }
    );
    
    res.json(
      createResponse('success', 'Exercise log updated successfully', result)
    );
  }

  async getExerciseLog(req: AuthRequest, res: Response) {
    const result = await this.workoutService.getExerciseLogById(
      req.params.id,
      req.user._id
    );
    
    res.json(
      createResponse('success', 'Exercise log retrieved successfully', result)
    );
  }

  async getExerciseLogsByDateRange(req: AuthRequest, res: Response) {
    const { startDate, endDate, kpiId } = req.query;

    const result = await this.workoutService.getExerciseLogsByDateRange({
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      userId: req.user._id,
      kpiId: kpiId as string
    });
    
    res.json(
      createResponse('success', 'Exercise logs retrieved successfully', result)
    );
  }
} 