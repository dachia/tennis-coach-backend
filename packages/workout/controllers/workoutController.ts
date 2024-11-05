import { Request, Response } from 'express';
import { Workout } from '../models/Workout';
import { ExerciseLog } from '../models/ExerciseLog';
import { ProgressComparison } from '../models/ProgressComparison';
import { AuthRequest } from '../../shared/middleware/auth';
import { createResponse } from '../../shared/utils/response.utils';
import { EventService } from '../../shared';
import { WorkoutStatus, ExerciseLogStatus } from '../types';
import {
  createWorkoutSchema,
  createExerciseLogSchema,
  updateWorkoutSchema,
  updateExerciseLogSchema
} from '../validation';

export class WorkoutController {
  constructor(
    private readonly workoutModel: typeof Workout,
    private readonly exerciseLogModel: typeof ExerciseLog,
    private readonly progressComparisonModel: typeof ProgressComparison,
    private readonly eventService: EventService,
  ) {}

  async createWorkout(req: AuthRequest, res: Response) {
    const validatedData = await createWorkoutSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    }).catch(err => {
      console.error('Workout creation validation failed:', err.errors);
      res.status(400).json(
        createResponse('fail', 'Validation failed', null, {
          message: 'Invalid input',
          details: err.errors
        })
      );
      return null;
    });

    if (!validatedData) return;

    // // If templateId is provided, verify it exists
    // if (validatedData.templateId) {
    //   const template = await this.templateModel.findById(validatedData.templateId);
    //   if (!template) {
    //     return res.status(404).json(
    //       createResponse('fail', 'Template not found')
    //     );
    //   }
    // }

    const workout = await this.workoutModel.create({
      ...validatedData,
      traineeId: req.user._id,
      status: WorkoutStatus.PLANNED
    });

    await this.eventService.publishDomainEvent({
      eventName: 'workout.created',
      payload: { 
        workoutId: workout._id,
        templateId: validatedData.templateId 
      }
    });

    res.status(201).json(
      createResponse('success', 'Workout created successfully', { workout })
    );
  }

  async createExerciseLog(req: AuthRequest, res: Response) {
    const validatedData = await createExerciseLogSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    }).catch(err => {
      console.error('Exercise log creation validation failed:', err.errors);
      res.status(400).json(
        createResponse('fail', 'Validation failed', null, {
          message: 'Invalid input',
          details: err.errors
        })
      );
      return null;
    });

    if (!validatedData) return;

    // Verify workout exists and belongs to trainee
    const workout = await this.workoutModel.findOne({
      _id: validatedData.workoutId,
      traineeId: req.user._id
    });

    if (!workout) {
      console.error(`Workout not found or unauthorized for exercise log creation. WorkoutId: ${validatedData.workoutId}, TraineeId: ${req.user._id}`);
      return res.status(404).json(
        createResponse('fail', 'Workout not found or unauthorized')
      );
    }

    const exerciseLog = await this.exerciseLogModel.create({
      ...validatedData,
      traineeId: req.user._id,
      logDate: new Date(),
      status: ExerciseLogStatus.COMPLETED
    });

    // Calculate and store progress comparison
    const previousLog = await this.exerciseLogModel
      .findOne({
        exerciseId: validatedData.exerciseId,
        traineeId: req.user._id,
        _id: { $ne: exerciseLog._id }
      })
      .sort({ logDate: -1 });

    if (previousLog) {
      const comparisonValue = ((exerciseLog.actualValue - previousLog.actualValue) / previousLog.actualValue) * 100;
      await this.progressComparisonModel.create({
        logId: exerciseLog._id,
        comparisonValue
      });
    }

    await this.eventService.publishDomainEvent({
      eventName: 'exerciseLog.created',
      payload: { exerciseLogId: exerciseLog._id }
    });

    res.status(201).json(
      createResponse('success', 'Exercise log created successfully', { exerciseLog })
    );
  }

  async updateWorkout(req: AuthRequest, res: Response) {
    const validatedData = await updateWorkoutSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    }).catch(err => {
      console.error('Workout update validation failed:', err.errors);
      res.status(400).json(
        createResponse('fail', 'Validation failed', null, {
          message: 'Invalid input',
          details: err.errors
        })
      );
      return null;
    });

    if (!validatedData) return;

    const workout = await this.workoutModel.findOneAndUpdate(
      { _id: req.params.id, traineeId: req.user._id },
      validatedData,
      { new: true }
    );

    if (!workout) {
      console.error(`Workout not found or unauthorized for update. WorkoutId: ${req.params.id}, TraineeId: ${req.user._id}`);
      return res.status(404).json(
        createResponse('fail', 'Workout not found or unauthorized')
      );
    }

    await this.eventService.publishDomainEvent({
      eventName: 'workout.updated',
      payload: { workoutId: workout._id }
    });

    res.json(
      createResponse('success', 'Workout updated successfully', { workout })
    );
  }

  async updateExerciseLog(req: AuthRequest, res: Response) {
    const validatedData = await updateExerciseLogSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    }).catch(err => {
      console.error('Exercise log update validation failed:', err.errors);
      res.status(400).json(
        createResponse('fail', 'Validation failed', null, {
          message: 'Invalid input',
          details: err.errors
        })
      );
      return null;
    });

    if (!validatedData) return;

    const exerciseLog = await this.exerciseLogModel.findOneAndUpdate(
      { _id: req.params.id, traineeId: req.user._id },
      validatedData,
      { new: true }
    );

    if (!exerciseLog) {
      console.error(`Exercise log not found or unauthorized for update. LogId: ${req.params.id}, TraineeId: ${req.user._id}`);
      return res.status(404).json(
        createResponse('fail', 'Exercise log not found or unauthorized')
      );
    }

    await this.eventService.publishDomainEvent({
      eventName: 'exerciseLog.updated',
      payload: { exerciseLogId: exerciseLog._id }
    });

    res.json(
      createResponse('success', 'Exercise log updated successfully', { exerciseLog })
    );
  }
} 