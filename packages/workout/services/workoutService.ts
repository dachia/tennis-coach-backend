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

    const [enrichedWorkout] = await this.enrichWorkoutResponse([workout], userId, true);
    return { workout: enrichedWorkout };
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

    const enrichedWorkouts = await this.enrichWorkoutResponse(workouts, userId, true);
    return { workouts: enrichedWorkouts };
  }

  async getWorkoutsByDay(params: {
    date: Date;
    userId: string;
    traineeId?: string;
  }) {
    // Create start and end of day timestamps
    const startOfDay = new Date(params.date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(params.date);
    endOfDay.setHours(23, 59, 59, 999);

    // Reuse existing date range functionality
    return this.getWorkoutsByDateRange({
      startDate: startOfDay,
      endDate: endOfDay,
      userId: params.userId,
      traineeId: params.traineeId
    });
  }

  async getCompletedWorkouts(userId: string): Promise<GetCompletedWorkoutsResponseDTO> {
    let workouts = await this.workoutModel
      .find({
        status: WorkoutStatus.COMPLETED,
        traineeId: userId
      })
      .populate('exerciseLogs')
      .sort({ startTimestamp: -1 });

    // If user is a coach, get their trainees' workouts too
    try {
      const coachTraineeResponse = await this.transport.request<
        { coachId: string },
        { trainees: { _id: string; email: string; name: string }[] }
      >('auth.coach.trainees', {
        type: 'GET_TRAINEES',
        payload: { coachId: userId }
      });

      if (coachTraineeResponse.trainees.length > 0) {
        const traineeIds = coachTraineeResponse.trainees.map(trainee => trainee._id);

        const traineeWorkouts = await this.workoutModel
          .find({
            status: WorkoutStatus.COMPLETED,
            traineeId: { $in: traineeIds }
          })
          .populate('exerciseLogs')
          .sort({ startTimestamp: -1 });

        workouts = [...workouts, ...traineeWorkouts];
      }
    } catch (err) {
      console.log('Error fetching trainees:', err);
    }

    const enrichedWorkouts = await this.enrichWorkoutResponse(workouts, userId, true);
    return { workouts: enrichedWorkouts };
  }

  private async enrichWorkoutResponse(workouts: IWorkout[], userId: string, includeTraineeInfo: boolean = false): Promise<EnrichedWorkoutDTO[]> {
    if (!workouts.length) return [];

    let traineeMap = new Map();
    // Get all exercise logs and their KPIs
    let exerciseMap = new Map();
    try {
      const exerciseIds = workouts
        .flatMap(w => w.exerciseLogs)
        .filter(log => log)
        .map(log => log.exerciseId.toString());

      if (exerciseIds.length > 0) {
        const exerciseResponse = await this.transport.request<
          { ids: string[]; userId: string },
          {
            _id: string;
            title: string;
            description: string;
            media: string[];
            createdBy: string;
            isShared?: boolean;
            createdAt: Date;
            updatedAt: Date;
            kpis: {
              _id: string;
              goalValue: number;
              unit: string;
              performanceGoal: string;
              exerciseId: string;
            }[]
          }[]
        >('exercise.getByIds', {
          type: 'GET_EXERCISES_BY_IDS',
          payload: { ids: exerciseIds, userId }
        });

        exerciseMap = new Map(
          exerciseResponse.map(exercise => [exercise._id, exercise])
        );
      }
    } catch (err) {
      console.log('Error fetching exercise information:', err);
    }
    if (includeTraineeInfo) {
      try {
        // Get all unique trainee IDs
        const traineeIds = [...new Set(workouts.map(w => w.traineeId.toString()))];

        // Fetch trainee information in bulk
        const traineeResponse = await this.transport.request<
          { ids: string[] },
          { users: { _id: string; email: string; name: string }[] }
        >('auth.users', {
          type: 'GET_USERS_BY_IDS',
          payload: { ids: traineeIds }
        });

        traineeMap = new Map(
          traineeResponse.users.map(user => [user._id, user])
        );
      } catch (err) {
        console.log('Error fetching trainee information:', err);
      }
    }

    return workouts.map(workout => {
      const workoutObj = workout.toObject ? workout.toObject() : workout;
      const traineeInfo = traineeMap.get(workout.traineeId.toString());
      const exerciseLogs = workoutObj.exerciseLogs.map((log: IExerciseLog) => {
        const exercise = exerciseMap.get(log.exerciseId.toString());
        const kpi = exercise?.kpis.find((kpi: any) => kpi._id === log.kpiId.toString());

        return {
          ...log,
          exerciseName: exercise?.title,
          kpiUnit: kpi?.unit,
          kpiPerformanceGoal: kpi?.performanceGoal
        };
      });

      return {
        ...workoutObj,
        _id: workoutObj._id.toString(),
        traineeId: workout.traineeId.toString(),
        templateId: workoutObj.templateId?.toString(),
        traineeEmail: traineeInfo?.email,
        traineeName: traineeInfo?.name,
        exerciseLogs
      };
    });
  }
} 