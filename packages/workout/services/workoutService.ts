import { IWorkout, Workout } from '../models/Workout';
import { ExerciseLog, IExerciseLog } from '../models/ExerciseLog';
import { EventService, ExerciseTransportClient } from '../../shared';
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
import { AuthTransportClient } from '../../shared/transport/helpers/authTransport';
import { mapExerciseLog, mapWorkout } from '../mappers/responseMappers';
import { EventRoutes } from '../../shared/events/constants';
import { WorkoutEvents } from '../../shared/events/types/workout';

export class WorkoutService {
  constructor(
    private readonly workoutModel: typeof Workout,
    private readonly exerciseLogModel: typeof ExerciseLog,
    private readonly eventService: EventService,
    private readonly exerciseTransportClient: ExerciseTransportClient,
    private readonly authTransportClient: AuthTransportClient
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
    const traineeResponse = await this.authTransportClient.getUsersByIds({
      ids: [data.userId],
      userId: data.userId
    });

    const trainee = traineeResponse.data?.payload.users[0];

    const workout = await this.workoutModel.create({
      ...validatedData,
      startTimestamp,
      traineeId: data.userId,
      status,
      traineeName: trainee?.name,
      traineeEmail: trainee?.email
    });

    if (validatedData.templateId) {
      try {

        const templateResponse = await this.exerciseTransportClient.getTemplate({
          id: validatedData.templateId,
          userId: data.userId
        });
        const template = templateResponse.data?.payload.template!;

        await Promise.all(
          template.exercises.flatMap(exercise =>
            exercise.kpis!.map(kpi =>
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

    await this.eventService.publishDomainEvent<WorkoutEvents.WorkoutCreated>({
      eventName: EventRoutes.Workout.CREATED,
      payload: {
        workoutId: workout._id.toString(),
        templateId: validatedData.templateId
      }
    });

    return { workout: mapWorkout(workout) };
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
    const exerciseResponse = await this.exerciseTransportClient.getExercise({
      id: validatedData.exerciseId,
      userId: data.userId
    });
    const exercise = exerciseResponse.data?.payload.exercise!;
    const kpiData = exercise.kpis!.find(kpi => kpi._id!.toString() === validatedData.kpiId);


    const exerciseLog = await this.exerciseLogModel.create({
      ...validatedData,
      traineeId: data.userId,
      logDate: new Date(),
      exerciseTitle: exercise.title,
      exerciseDescription: exercise.description,
      kpiUnit: kpiData?.unit,
      kpiPerformanceGoal: kpiData?.performanceGoal,
      status: ExerciseLogStatus.COMPLETED,
    });

    await this.eventService.publishDomainEvent<WorkoutEvents.ExerciseLogCreated>({
      eventName: EventRoutes.ExerciseLog.CREATED,
      payload: {
        exerciseLogId: exerciseLog._id.toString(),
        workoutId: validatedData.workoutId,
        exerciseId: validatedData.exerciseId,
        kpiId: validatedData.kpiId,
        userId: data.userId
      }
    });

    return { exerciseLog: mapExerciseLog(exerciseLog) };
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

    await this.eventService.publishDomainEvent<WorkoutEvents.WorkoutUpdated>({
      eventName: EventRoutes.Workout.UPDATED,
      payload: {
        workoutId: workout._id.toString(),
        status: validatedData.status,
        endTimestamp: validatedData.endTimestamp
      }
    });

    return { workout: mapWorkout(workout) };
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

    await this.eventService.publishDomainEvent<WorkoutEvents.ExerciseLogUpdated>({
      eventName: EventRoutes.ExerciseLog.UPDATED,
      payload: {
        exerciseLogId: exerciseLog._id.toString(),
        actualValue: validatedData.actualValue,
        status: validatedData.status,
        kpiId: exerciseLog.kpiId.toString(),
        userId: exerciseLog.traineeId.toString()
      }
    });

    return { exerciseLog: mapExerciseLog(exerciseLog) };
  }


  async addExerciseToWorkout(workoutId: string, exerciseId: string, userId: string) {
    const workout = await this.workoutModel.findOne({
      _id: workoutId,
      traineeId: userId
    });

    if (!workout) {
      throw new DomainError('Workout not found or unauthorized', 404);
    }

    const exerciseResponse = await this.exerciseTransportClient.getExercise({
      id: exerciseId,
      userId
    });

    if (!exerciseResponse) {
      throw new DomainError('Exercise not found', 404);
    }
    // Get trainee information
    const traineeResponse = await this.authTransportClient.getUsersByIds({
      ids: [userId],
      userId
    });

    const trainee = traineeResponse.data?.payload.users[0];

    const exercise = exerciseResponse.data?.payload.exercise!;

    const exerciseLogs = await Promise.all(exercise.kpis!.map(async (kpi) => this.exerciseLogModel.create({
      workoutId: workout._id,
      exerciseId: exercise._id,
      kpiId: kpi._id,
      traineeId: userId,
      logDate: new Date(),
      exerciseTitle: exercise.title,
      exerciseDescription: exercise.description,
      kpiUnit: kpi.unit,
      kpiPerformanceGoal: kpi.performanceGoal,
      actualValue: 0,
      duration: 0,
      status: ExerciseLogStatus.PENDING,
      traineeName: trainee?.name,
      traineeEmail: trainee?.email
    })));

    return { exerciseLogs: exerciseLogs.map(mapExerciseLog) };
  }
} 