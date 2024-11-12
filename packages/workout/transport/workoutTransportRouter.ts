import { Transport, TransportRouter } from '../../shared/transport';
import { WorkoutService } from '../services/workoutService';
import { WorkoutQueryService } from '../services/workoutQueryService';
import { TransportRoutes } from '../../shared/transport/constants';
import { WorkoutTransport } from '../../shared/transport/types/workout';
import { createResponse } from '../../shared/utils/response.utils';

export class WorkoutTransportRouter {
  private router: TransportRouter;

  constructor(
    transport: Transport,
    private readonly workoutService: WorkoutService,
    private readonly workoutQueryService: WorkoutQueryService
  ) {
    this.router = new TransportRouter(transport);
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.register<
      WorkoutTransport.CreateWorkoutRequest,
      WorkoutTransport.CreateWorkoutResponse
    >(TransportRoutes.Workout.CREATE, async (payload) => {
      const response = await this.workoutService.createWorkout(payload);
      return createResponse('success', 'Workout created successfully', response);
    });

    this.router.register<
      WorkoutTransport.CreateExerciseLogRequest,
      WorkoutTransport.CreateExerciseLogResponse
    >(TransportRoutes.ExerciseLog.CREATE, async (payload) => {
      const response = await this.workoutService.createExerciseLog(payload);
      return createResponse('success', 'Exercise log created successfully', response);
    });

    this.router.register<
      WorkoutTransport.UpdateWorkoutRequest,
      WorkoutTransport.UpdateWorkoutResponse
    >(TransportRoutes.Workout.UPDATE, async (payload) => {
      const { id, ...data } = payload;
      const response = await this.workoutService.updateWorkout(id, data);
      return createResponse('success', 'Workout updated successfully', response);
    });

    this.router.register<
      WorkoutTransport.UpdateExerciseLogRequest,
      WorkoutTransport.UpdateExerciseLogResponse
    >(TransportRoutes.ExerciseLog.UPDATE, async (payload) => {
      const { id, ...data } = payload;
      const response = await this.workoutService.updateExerciseLog(id, data);
      return createResponse('success', 'Exercise log updated successfully', response);
    });

    this.router.register<
      WorkoutTransport.GetExerciseLogRequest,
      WorkoutTransport.GetExerciseLogResponse
    >(TransportRoutes.ExerciseLog.GET, async (payload) => {
      const response = await this.workoutQueryService.getExerciseLogById(payload.id, payload.userId);
      return createResponse('success', 'Exercise log fetched successfully', response);
    });

    this.router.register<
      WorkoutTransport.GetExerciseLogsByDateRangeRequest,
      WorkoutTransport.GetExerciseLogsByDateRangeResponse
    >(TransportRoutes.ExerciseLog.GET_BY_DATE_RANGE, async (payload) => {
      const response = await this.workoutQueryService.getExerciseLogsByDateRange({
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
        userId: payload.userId,
        kpiId: payload.kpiId
      });
      return createResponse('success', 'Exercise logs fetched successfully', response);
    });
  }

  async listen() {
    await this.router.listen();
  }

  async close() {
    await this.router.close();
  }
} 