import { Workout } from '../models/Workout';
import { ExerciseLog } from '../models/ExerciseLog';
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
import { Transport } from '../../shared';
import { GetTemplateByIdResponseDTO } from '../../exercise/types';
import { dateRangeSchema } from '../validation';
import * as yup from 'yup';

export class WorkoutService {
  constructor(
    private readonly workoutModel: typeof Workout,
    private readonly exerciseLogModel: typeof ExerciseLog,
    private readonly eventService: EventService,
    private readonly transport: Transport
  ) {}

  private determineWorkoutStatus(startTimestamp: Date): WorkoutStatus {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const workoutDate = new Date(startTimestamp);
    workoutDate.setHours(0, 0, 0, 0);

    if (workoutDate > today) {
      return WorkoutStatus.PLANNED;
    } else if (workoutDate.getTime() === today.getTime()) {
      return WorkoutStatus.IN_PROGRESS;
    } else {
      return WorkoutStatus.COMPLETED;
    }
  }

  async createWorkout(data: CreateWorkoutDTO) {
    let validatedData;
    try {
      validatedData = await createWorkoutSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });
    } catch (err: any) {
      throw new DomainError(err.message);
    }

    const startTimestamp = validatedData.startTimestamp || new Date();
    const status = this.determineWorkoutStatus(startTimestamp);

    const workout = await this.workoutModel.create({
      ...validatedData,
      startTimestamp,
      traineeId: data.userId,
      status
    });

    if (validatedData.templateId) {
      try {
        const templateResponse = await this.transport.request<
          { id: string; userId: string },
          GetTemplateByIdResponseDTO
        >('template.get', {
          type: 'GET_TEMPLATE',
          payload: {
            id: validatedData.templateId,
            userId: data.userId
          }
        });

        const exerciseLogs = await Promise.all(
          templateResponse.template.exercises.map(exercise => 
            this.exerciseLogModel.create({
              workoutId: workout._id,
              exerciseId: exercise._id,
              kpiId: exercise.kpis[0]._id,
              traineeId: data.userId,
              logDate: startTimestamp,
              actualValue: 0,
              duration: 0,
              status: ExerciseLogStatus.PENDING
            })
          )
        );
      } catch (err: any) {
        await this.workoutModel.findByIdAndDelete(workout._id);
        throw new DomainError('Failed to fetch template or create exercise logs');
      }
    }

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
    let validatedData;
    try {
      validatedData = await createExerciseLogSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });
    } catch (err: any) {
      throw new DomainError(err.message);
    }

    const workout = await this.workoutModel.findOne({
      _id: validatedData.workoutId,
      traineeId: data.userId
    });

    if (!workout) {
      throw new DomainError('Workout not found or unauthorized', 404);
    }

    const exerciseLog = await this.exerciseLogModel.create({
      ...validatedData,
      traineeId: data.userId,
      logDate: new Date(),
      status: ExerciseLogStatus.COMPLETED
    });

    await this.eventService.publishDomainEvent({
      eventName: 'exerciseLog.created',
      payload: { exerciseLogId: exerciseLog._id }
    });

    return { exerciseLog };
  }

  async updateWorkout(id: string, data: UpdateWorkoutDTO) {
    let validatedData;
    try {
      validatedData = await updateWorkoutSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });
    } catch (err: any) {
      throw new DomainError(err.message);
    }

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
    let validatedData;
    try {
      validatedData = await updateExerciseLogSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });
    } catch (err: any) {
      throw new DomainError(err.message);
    }

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

  async getExerciseLogById(logId: string, userId: string) {
    const exerciseLog = await this.exerciseLogModel.findOne({
      _id: logId,
      traineeId: userId
    });

    if (!exerciseLog) {
      throw new DomainError('Exercise log not found or unauthorized', 404);
    }

    return { exerciseLog };
  }

  async getExerciseLogsByDateRange(params: {
    startDate: Date;
    endDate: Date;
    userId: string;
    kpiId: string;
  }) {
    // Add validation for kpiId
    const exerciseLogDateRangeSchema = dateRangeSchema.shape({
      kpiId: yup.string().required('KPI ID is required')
    });

    let validatedData;
    try {
      validatedData = await exerciseLogDateRangeSchema.validate(params, {
        abortEarly: false,
        stripUnknown: true
      });
    } catch (err: any) {
      console.log(err);
      throw new DomainError(err.message);
    }

    const { startDate, endDate, userId, kpiId } = validatedData;

    const exerciseLogs = await this.exerciseLogModel.find({
      traineeId: userId,
      kpiId: kpiId,
      logDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ logDate: 1 });

    return { exerciseLogs };
  }

  async getWorkoutById(workoutId: string, userId: string) {
    // First try to find workout where user is the trainee
    let workout = await this.workoutModel
      .findOne({
        _id: workoutId,
        traineeId: userId
      })
      .populate('exerciseLogs');

    // If not found, check if user is a coach for the workout's trainee
    if (!workout) {
      workout = await this.workoutModel.findById(workoutId).populate('exerciseLogs');
      if (workout) {
        const coachTrainee = await this.transport.request<
          { traineeId: string; coachId: string },
          { hasRelationship: boolean }
        >('auth.checkCoachTrainee', {
          type: 'CHECK_COACH_TRAINEE',
          payload: {
            traineeId: workout.traineeId.toString(),
            coachId: userId
          }
        });

        if (!coachTrainee.hasRelationship) {
          throw new DomainError('Workout not found or unauthorized', 404);
        }
      } else {
        throw new DomainError('Workout not found or unauthorized', 404);
      }
    }

    return { workout };
  }

  async getWorkoutsByDateRange(params: {
    startDate: Date;
    endDate: Date;
    userId: string;
    traineeId?: string;
  }) {
    // Validate the input parameters
    let validatedData;
    try {
      validatedData = await dateRangeSchema.validate(params, {
        abortEarly: false,
        stripUnknown: true
      });
    } catch (err: any) {
      console.log(err);
      throw new DomainError(err.errors.join(', '));
    }

    const { startDate, endDate, userId, traineeId } = validatedData;

    // If traineeId is provided, verify coach-trainee relationship
    if (traineeId) {
      const coachTrainee = await this.transport.request<
        { traineeId: string; coachId: string },
        { hasRelationship: boolean }
      >('auth.checkCoachTrainee', {
        type: 'CHECK_COACH_TRAINEE',
        payload: {
          traineeId,
          coachId: userId
        }
      });

      if (!coachTrainee.hasRelationship) {
        throw new DomainError('Unauthorized to access trainee workouts', 403);
      }
    }

    const workouts = await this.workoutModel
      .find({
        traineeId: traineeId || userId,
        startTimestamp: {
          $gte: startDate,
          $lte: endDate
        }
      })
      .populate('exerciseLogs')
      .sort({ startTimestamp: 1 });

    return { workouts };
  }
} 