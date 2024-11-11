import { IWorkout, Workout } from '../models/Workout';
import { ExerciseLog, IExerciseLog } from '../models/ExerciseLog';
import { Transport } from '../../shared';
import { DomainError } from '../../shared/errors/DomainError';
import { EnrichedWorkoutDTO, GetCompletedWorkoutsResponseDTO } from '../types';
import { dateRangeSchema } from '../validation';
import * as yup from 'yup';

export class WorkoutQueryService {
  constructor(
    private readonly workoutModel: typeof Workout,
    private readonly exerciseLogModel: typeof ExerciseLog,
    private readonly transport: Transport
  ) {}

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
    let workout = await this.workoutModel
      .findOne({
        _id: workoutId,
        traineeId: userId
      })
      .populate('exerciseLogs');

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
        const traineeIds = [...new Set(workouts.map(w => w.traineeId.toString()))];

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

      const exercises = workoutObj.exerciseLogs.reduce((acc: any[], log: IExerciseLog) => {
        const exercise = exerciseMap.get(log.exerciseId.toString());
        const kpi = exercise?.kpis.find((kpi: any) => kpi._id === log.kpiId.toString());

        const logEntry = {
          ...log,
          kpiUnit: kpi?.unit,
          kpiPerformanceGoal: kpi?.performanceGoal
        };

        const existingExercise = acc.find(e => e.exerciseId === log.exerciseId.toString());
        if (existingExercise) {
          existingExercise.logs.push(logEntry);
        } else {
          acc.push({
            exerciseId: log.exerciseId.toString(),
            exerciseName: exercise?.title,
            logs: [logEntry]
          });
        }

        return acc;
      }, []);

      return {
        ...workoutObj,
        _id: workoutObj._id.toString(),
        traineeId: workout.traineeId.toString(),
        templateId: workoutObj.templateId?.toString(),
        traineeEmail: traineeInfo?.email,
        traineeName: traineeInfo?.name,
        exercises
      };
    });
  }
} 