import { IWorkout, Workout } from '../models/Workout';
import { ExerciseLog, IExerciseLog } from '../models/ExerciseLog';
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
import { EnrichedWorkoutDTO, GetCompletedWorkoutsResponseDTO } from '../types';

export class WorkoutService {
  constructor(
    private readonly workoutModel: typeof Workout,
    private readonly exerciseLogModel: typeof ExerciseLog,
    private readonly eventService: EventService,
    private readonly transport: Transport
  ) { }

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
      throw new DomainError(err.errors.join(', '));
    }

    const startTimestamp = validatedData.startTimestamp || new Date();
    const status = this.determineWorkoutStatus(startTimestamp);
    // Get trainee information
    const traineeResponse = await this.transport.request<
      { ids: string[] },
      { users: { _id: string; email: string; name: string }[] }
    >('auth.users', {
      type: 'GET_USERS_BY_IDS',
      payload: { ids: [data.userId] }
    });

    const trainee = traineeResponse.users[0];

    const workout = await this.workoutModel.create({
      ...validatedData,
      startTimestamp,
      traineeId: data.userId,
      status,
      traineeName: trainee.name,
      traineeEmail: trainee.email
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

        await Promise.all(
          templateResponse.template.exercises.flatMap(exercise =>
            exercise.kpis.map(kpi =>
              this.exerciseLogModel.create({
                workoutId: workout._id,
                exerciseId: exercise._id,
                kpiId: kpi._id,
                traineeId: data.userId,
                logDate: startTimestamp,
                actualValue: 0,
                duration: 0,
                exerciseTitle: exercise.title,
                exerciseDescription: exercise.description,
                kpiGoalValue: kpi.goalValue,
                kpiUnit: kpi.unit,
                kpiPerformanceGoal: kpi.performanceGoal,
                status: ExerciseLogStatus.PENDING,
              })
            )
          )
        );
      } catch (err: any) {
        console.log(err);
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
    // fetch exercise and kpi data
    const exerciseResponse = await this.transport.request<
      { id: string; userId: string },
      { exercise: { _id: string; title: string; description: string; kpis: { _id: string, goalValue: number, unit: string, performanceGoal: string }[] } }
    >('exercise.get', {
      type: 'GET_EXERCISE',
      payload: { id: validatedData.exerciseId, userId: data.userId }
    });
    const kpiData = exerciseResponse.exercise.kpis.find(kpi => kpi._id.toString() === validatedData.kpiId);


    const exerciseLog = await this.exerciseLogModel.create({
      ...validatedData,
      traineeId: data.userId,
      logDate: new Date(),
      exerciseTitle: exerciseResponse.exercise.title,
      exerciseDescription: exerciseResponse.exercise.description,
      kpiGoalValue: kpiData?.goalValue,
      kpiUnit: kpiData?.unit,
      kpiPerformanceGoal: kpiData?.performanceGoal,
      status: ExerciseLogStatus.COMPLETED,
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


  async addExerciseToWorkout(workoutId: string, exerciseId: string, userId: string) {
    const workout = await this.workoutModel.findOne({
      _id: workoutId,
      traineeId: userId
    });

    if (!workout) {
      throw new DomainError('Workout not found or unauthorized', 404);
    }

    const exerciseResponse = await this.transport.request<
      { id: string; userId: string },
      { _id: string; exercise: { _id: string, title: string, description: string, kpis: { _id: string, goalValue: number, unit: string, performanceGoal: string }[] } }
    >('exercise.get', {
      type: 'GET_EXERCISE',
      payload: { id: exerciseId, userId }
    });

    if (!exerciseResponse) {
      throw new DomainError('Exercise not found', 404);
    }
    // Get trainee information
    const traineeResponse = await this.transport.request<
      { ids: string[] },
      { users: { _id: string; email: string; name: string }[] }
    >('auth.users', {
      type: 'GET_USERS_BY_IDS',
      payload: { ids: [userId] }
    });

    const trainee = traineeResponse.users[0];


    const exerciseLogs = await Promise.all(exerciseResponse.exercise.kpis.map(async (kpi) => this.exerciseLogModel.create({
      workoutId: workout._id,
      exerciseId: exerciseResponse.exercise._id,
      kpiId: kpi._id,
      traineeId: userId,
      logDate: new Date(),
      exerciseTitle: exerciseResponse.exercise.title,
      exerciseDescription: exerciseResponse.exercise.description,
      kpiGoalValue: kpi.goalValue,
      kpiUnit: kpi.unit,
      kpiPerformanceGoal: kpi.performanceGoal,
      actualValue: 0,
      duration: 0,
      status: ExerciseLogStatus.PENDING,
      traineeName: trainee.name,
      traineeEmail: trainee.email
    })));

    return { exerciseLogs };
  }
} 