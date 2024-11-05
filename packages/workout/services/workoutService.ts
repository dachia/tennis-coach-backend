import { Workout } from '../models/Workout';
import { ExerciseLog } from '../models/ExerciseLog';
import { ProgressComparison } from '../models/ProgressComparison';
import { EventService } from '../../shared';
import { DomainError } from '../../shared/errors/DomainError';
import {
  WorkoutStatus,
  ExerciseLogStatus,
  CreateWorkoutDTO,
  CreateExerciseLogDTO,
  UpdateWorkoutDTO,
  UpdateExerciseLogDTO
} from '../types';
import {
  createWorkoutSchema,
  createExerciseLogSchema,
  updateWorkoutSchema,
  updateExerciseLogSchema
} from '../validation';

export class WorkoutService {
  constructor(
    private readonly workoutModel: typeof Workout,
    private readonly exerciseLogModel: typeof ExerciseLog,
    private readonly progressComparisonModel: typeof ProgressComparison,
    private readonly eventService: EventService,
  ) {}

  async createWorkout(data: CreateWorkoutDTO) {
    const validatedData = await createWorkoutSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    const workout = await this.workoutModel.create({
      ...validatedData,
      traineeId: data.userId,
      status: WorkoutStatus.PLANNED
    });

    await this.eventService.publishDomainEvent({
      eventName: 'workout.created',
      payload: { 
        workoutId: workout._id,
        templateId: validatedData.templateId 
      }
    });

    return { workout };
  }

  async createExerciseLog(data: CreateExerciseLogDTO) {
    const validatedData = await createExerciseLogSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    const workout = await this.workoutModel.findOne({
      _id: validatedData.workoutId,
      traineeId: data.userId
    });

    if (!workout) {
      throw new DomainError('Workout not found or unauthorized');
    }

    const exerciseLog = await this.exerciseLogModel.create({
      ...validatedData,
      traineeId: data.userId,
      logDate: new Date(),
      status: ExerciseLogStatus.COMPLETED
    });

    const previousLog = await this.exerciseLogModel
      .findOne({
        exerciseId: validatedData.exerciseId,
        traineeId: data.userId,
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

    return { exerciseLog };
  }

  async updateWorkout(id: string, data: UpdateWorkoutDTO) {
    const validatedData = await updateWorkoutSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    const workout = await this.workoutModel.findOneAndUpdate(
      { _id: id, traineeId: data.userId },
      validatedData,
      { new: true }
    );

    if (!workout) {
      throw new DomainError('Workout not found or unauthorized');
    }

    await this.eventService.publishDomainEvent({
      eventName: 'workout.updated',
      payload: { workoutId: workout._id }
    });

    return { workout };
  }

  async updateExerciseLog(id: string, data: UpdateExerciseLogDTO) {
    const validatedData = await updateExerciseLogSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    const exerciseLog = await this.exerciseLogModel.findOneAndUpdate(
      { _id: id, traineeId: data.userId },
      validatedData,
      { new: true }
    );

    if (!exerciseLog) {
      throw new DomainError('Exercise log not found or unauthorized');
    }

    await this.eventService.publishDomainEvent({
      eventName: 'exerciseLog.updated',
      payload: { exerciseLogId: exerciseLog._id }
    });

    return { exerciseLog };
  }
} 