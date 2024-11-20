import { Response } from 'express';
import { AuthRequest } from '../../shared/middleware/auth';
import { createResponse } from '../../shared/utils/response.utils';
import { WorkoutService } from '../services/workoutService';
import { WorkoutQueryService } from '../services/workoutQueryService';

export class WorkoutController {
  constructor(
    private readonly workoutService: WorkoutService,
    private readonly workoutQueryService: WorkoutQueryService
  ) {}

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
    const result = await this.workoutQueryService.getExerciseLogById(
      req.params.id,
      req.user._id
    );

    res.json(
      createResponse('success', 'Exercise log retrieved successfully', result)
    );
  }

  async getExerciseLogsByDateRange(req: AuthRequest, res: Response) {
    const { startDate, endDate, kpiId } = req.query;

    const result = await this.workoutQueryService.getExerciseLogsByDateRange({
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      userId: req.user._id,
      kpiId: kpiId as string
    });

    res.json(
      createResponse('success', 'Exercise logs retrieved successfully', result)
    );
  }

  async getWorkout(req: AuthRequest, res: Response) {
    const result = await this.workoutQueryService.getWorkoutById(
      req.params.id,
      req.user._id
    );

    res.json(
      createResponse('success', 'Workout retrieved successfully', result)
    );
  }

  async getWorkoutsByDateRange(req: AuthRequest, res: Response) {
    const { startDate, endDate, traineeId } = req.query;

    const result = await this.workoutQueryService.getWorkoutsByDateRange({
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      userId: req.user._id,
      traineeId: traineeId as string
    });

    res.json(
      createResponse('success', 'Workouts retrieved successfully', result)
    );
  }

  async getWorkoutsByDay(req: AuthRequest, res: Response) {
    const { date, traineeId } = req.query;

    const result = await this.workoutQueryService.getWorkoutsByDay({
      date: new Date(date as string),
      userId: req.user._id,
      traineeId: traineeId as string
    });

    res.json(
      createResponse('success', 'Workouts retrieved successfully', result)
    );
  }
  async getCompletedWorkouts(req: AuthRequest, res: Response) {
    const result = await this.workoutQueryService.getAllWorkouts(req.user._id);

    res.json(
      createResponse('success', 'Completed workouts retrieved successfully', result)
    );
  }

  async addExerciseToWorkout(req: AuthRequest, res: Response) {
    const result = await this.workoutService.addExerciseToWorkout(
      req.params.workoutId,
      req.body.exerciseId,
      req.user._id
    );

    res.status(201).json(
      createResponse('success', 'Exercise added to workout successfully', result)
    );
  }

  async getExerciseLogsByExerciseId(req: AuthRequest, res: Response) {
    const result = await this.workoutQueryService.getExerciseLogsByExerciseId(
      req.params.exerciseId,
      req.user._id
    );

    res.json(
      createResponse('success', 'Exercise logs retrieved successfully', result)
    );
  }
} 