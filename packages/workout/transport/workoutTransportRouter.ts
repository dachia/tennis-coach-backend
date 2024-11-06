import { Transport, TransportRouter } from '../../shared/transport';
import { IWorkout } from '../models/Workout';
import { IExerciseLog } from '../models/ExerciseLog';
import { WorkoutService } from '../services/workoutService';
import {
  WorkoutDTO,
  ExerciseLogDTO,
  CreateWorkoutDTO,
  CreateExerciseLogDTO,
  UpdateWorkoutDTO,
  UpdateExerciseLogDTO
} from '../types';

export class WorkoutTransportRouter {
  private router: TransportRouter;

  constructor(
    transport: Transport,
    private readonly workoutService: WorkoutService
  ) {
    this.router = new TransportRouter(transport);
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.register<CreateWorkoutDTO, { workout: IWorkout }>(
      'workout.create',
      async (payload) => {
        return this.workoutService.createWorkout(payload);
      }
    );

    this.router.register<CreateExerciseLogDTO, { exerciseLog: IExerciseLog }>(
      'exerciseLog.create',
      async (payload) => {
        return this.workoutService.createExerciseLog(payload);
      }
    );

    this.router.register<{ id: string; userId: string } & Partial<WorkoutDTO>, { workout: IWorkout | null }>(
      'workout.update',
      async (payload) => {
        const { id, ...data } = payload;
        return this.workoutService.updateWorkout(id, data);
      }
    );

    this.router.register<{ id: string; userId: string } & Partial<ExerciseLogDTO>, { exerciseLog: IExerciseLog | null }>(
      'exerciseLog.update',
      async (payload) => {
        const { id, ...data } = payload;
        return this.workoutService.updateExerciseLog(id, data);
      }
    );

    this.router.register<{ id: string; userId: string }, { exerciseLog: IExerciseLog | null }>(
      'exerciseLog.get',
      async (payload) => {
        const { id, userId } = payload;
        return this.workoutService.getExerciseLogById(id, userId);
      }
    );

    this.router.register<{
      startDate: string;
      endDate: string;
      userId: string;
      kpiId: string;
    }, { exerciseLogs: IExerciseLog[] }>(
      'exerciseLog.getByDateRange',
      async (payload) => {
        const { startDate, endDate, userId, kpiId } = payload;
        return this.workoutService.getExerciseLogsByDateRange({
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          userId,
          kpiId
        });
      }
    );
  }
  async listen() {
    await this.router.listen();
  }

  async close() {
    await this.router.close();
  }
} 