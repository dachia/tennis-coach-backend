import { IWorkout, Workout } from '../models/Workout';
import { ExerciseLog, IExerciseLog } from '../models/ExerciseLog';
import { ExerciseTransportClient, Transport } from '../../shared';
import { DomainError } from '../../shared/errors/DomainError';
import { EnrichedWorkoutDTO, GetCompletedWorkoutsResponseDTO } from '../types';
import { dateRangeSchema } from '../validation';
import * as yup from 'yup';
import { AuthTransportClient } from '../../shared/transport/helpers/authTransport';
import { groupExerciseLogsByExerciseId, mapExerciseLog, mapWorkout } from '../mappers/responseMappers';
import { FilterQuery } from 'mongoose';

export class WorkoutQueryService {
  constructor(
    private readonly workoutModel: typeof Workout,
    private readonly exerciseLogModel: typeof ExerciseLog,
    private readonly authTransportClient: AuthTransportClient
  ) {}

  async getExerciseLogById(logId: string, userId: string) {
    const exerciseLog = await this.exerciseLogModel.findOne({
      _id: logId,
      traineeId: userId
    });

    if (!exerciseLog) {
      throw new DomainError('Exercise log not found or unauthorized', 404);
    }

    return { exerciseLog: mapExerciseLog(exerciseLog) };
  }

  async getExerciseLogsByDateRange(params: {
    startDate: Date;
    endDate: Date;
    userId: string;
    kpiId?: string;
    exerciseId?: string;
    templateId?: string;
  }) {
    const exerciseLogDateRangeSchema = dateRangeSchema.shape({
      kpiId: yup.string().optional(),
      exerciseId: yup.string().optional(),
      templateId: yup.string().optional()
    });

    let validatedData;
    try {
      validatedData = await exerciseLogDateRangeSchema.validate(params, {
        abortEarly: false,
        stripUnknown: true
      });
    } catch (err: any) {
      throw new DomainError(err.message);
    }

    const { startDate, endDate, userId, kpiId, exerciseId, templateId } = validatedData;
    const query: FilterQuery<IExerciseLog> = {
      traineeId: userId,
      logDate: {
        $gte: startDate,
        $lte: endDate
      }
    };
    if (kpiId) {
      query.kpiId = kpiId;
    }
    if (exerciseId) {
      query.exerciseId = exerciseId;
    }
    if (templateId) {
      query.templateId = templateId;
    }

    const exerciseLogs = await this.exerciseLogModel.find(query).sort({ logDate: 1, createdAt: 1 });

    return { exerciseLogs: exerciseLogs.map(mapExerciseLog) };
  }

  async getWorkoutById(workoutId: string, userId: string) {
    let workout = await this.workoutModel
      .findOne({
        _id: workoutId,
        traineeId: userId
      })
      .populate('exerciseLogs');

    if (!workout) {
      workout = await this.workoutModel.findById(workoutId).populate('exerciseLogs');
      if (workout) {
        const coachTrainee = await this.authTransportClient.checkCoachTrainee({
          traineeId: workout.traineeId.toString(),
          coachId: userId,
          userId
        });

        if (!coachTrainee.data?.payload.hasRelationship) {
          throw new DomainError('Workout not found or unauthorized', 404);
        }
      } else {
        throw new DomainError('Workout not found or unauthorized', 404);
      }
    }

    const [enrichedWorkout] = await this.enrichWorkoutResponse([workout]);
    return { workout: enrichedWorkout };
  }

  async getWorkoutsByDateRange(params: {
    startDate: Date;
    endDate: Date;
    userId: string;
    traineeId?: string;
  }) {
    let validatedData;
    try {
      validatedData = await dateRangeSchema.validate(params, {
        abortEarly: false,
        stripUnknown: true
      });
    } catch (err: any) {
      throw new DomainError(err.errors.join(', '));
    }

    const { startDate, endDate, userId, traineeId } = validatedData;

    if (traineeId) {
      const coachTrainee = await this.authTransportClient.checkCoachTrainee({
        traineeId,
        coachId: userId,
        userId
      });

      if (!coachTrainee.data?.payload.hasRelationship) {
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

    const enrichedWorkouts = await this.enrichWorkoutResponse(workouts);
    return { workouts: enrichedWorkouts };
  }

  async getWorkoutsByDay(params: {
    date: Date;
    userId: string;
    traineeId?: string;
  }) {
    const startOfDay = new Date(params.date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(params.date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getWorkoutsByDateRange({
      startDate: startOfDay,
      endDate: endOfDay,
      userId: params.userId,
      traineeId: params.traineeId
    });
  }

  async getAllWorkouts(userId: string): Promise<GetCompletedWorkoutsResponseDTO> {
    let workouts = await this.workoutModel
      .find({
        traineeId: userId
      })
      .populate('exerciseLogs')
      .sort({ startTimestamp: -1 });

    try {
      const coachTraineeResponse = await this.authTransportClient.getTraineesByCoach({
        coachId: userId,
        userId
      });

      const trainees = coachTraineeResponse.data?.payload!.trainees!;
      if (trainees.length > 0) {
        const traineeIds = trainees.map((trainee: any) => trainee._id);

        const traineeWorkouts = await this.workoutModel
          .find({
            traineeId: { $in: traineeIds }
          })
          .populate('exerciseLogs')
          .sort({ startTimestamp: -1 });

        workouts = [...workouts, ...traineeWorkouts];
      }
    } catch (err) {
      console.log('Error fetching trainees:', err);
    }

    const enrichedWorkouts = await this.enrichWorkoutResponse(workouts);
    return { workouts: enrichedWorkouts };
  }

  async getExerciseLogsByExerciseId(exerciseId: string, userId: string) {
    const exerciseLogs = await this.exerciseLogModel.find({
      exerciseId,
      traineeId: userId
    }).sort({ logDate: -1 });

    return { exerciseLogs: exerciseLogs.map(mapExerciseLog) };
  }

  private async enrichWorkoutResponse(workouts: IWorkout[]): Promise<EnrichedWorkoutDTO[]> {
    if (!workouts.length) return [];

    return workouts.map(workout => {
      const workoutObj = mapWorkout(workout);
      const exercises = groupExerciseLogsByExerciseId(workout.exerciseLogs || []);

      return {
        ...workoutObj,
        exercises
      };
    });
  }
} 