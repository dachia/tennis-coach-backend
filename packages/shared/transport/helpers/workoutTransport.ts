import { TransportRoutes } from '../constants';
import { Transport } from '../transport';
import { WorkoutTransport } from '../types/workout';
import { createTypedRequest } from './typeRequest';

export class WorkoutTransportClient {
  constructor(private transport: Transport) {}

  async createWorkout(payload: WorkoutTransport.CreateWorkoutRequest) {
    return createTypedRequest<
      WorkoutTransport.CreateWorkoutRequest,
      WorkoutTransport.CreateWorkoutResponse
    >(this.transport, TransportRoutes.Workout.CREATE, payload);
  }

  async updateWorkout(payload: WorkoutTransport.UpdateWorkoutRequest) {
    return createTypedRequest<
      WorkoutTransport.UpdateWorkoutRequest,
      WorkoutTransport.UpdateWorkoutResponse
    >(this.transport, TransportRoutes.Workout.UPDATE, payload);
  }

  async createExerciseLog(payload: WorkoutTransport.CreateExerciseLogRequest) {
    return createTypedRequest<
      WorkoutTransport.CreateExerciseLogRequest,
      WorkoutTransport.CreateExerciseLogResponse
    >(this.transport, TransportRoutes.ExerciseLog.CREATE, payload);
  }

  async updateExerciseLog(payload: WorkoutTransport.UpdateExerciseLogRequest) {
    return createTypedRequest<
      WorkoutTransport.UpdateExerciseLogRequest,
      WorkoutTransport.UpdateExerciseLogResponse
    >(this.transport, TransportRoutes.ExerciseLog.UPDATE, payload);
  }

  async getExerciseLog(payload: WorkoutTransport.GetExerciseLogRequest) {
    return createTypedRequest<
      WorkoutTransport.GetExerciseLogRequest,
      WorkoutTransport.GetExerciseLogResponse
    >(this.transport, TransportRoutes.ExerciseLog.GET, payload);
  }

  async getExerciseLogsByDateRange(payload: WorkoutTransport.GetExerciseLogsByDateRangeRequest) {
    return createTypedRequest<
      WorkoutTransport.GetExerciseLogsByDateRangeRequest,
      WorkoutTransport.GetExerciseLogsByDateRangeResponse
    >(this.transport, TransportRoutes.ExerciseLog.GET_BY_DATE_RANGE, payload);
  }

  async getWorkoutsByDateRange(payload: WorkoutTransport.GetWorkoutsByDateRangeRequest) {
    return createTypedRequest<
      WorkoutTransport.GetWorkoutsByDateRangeRequest,
      WorkoutTransport.GetWorkoutsByDateRangeResponse
    >(this.transport, TransportRoutes.Workout.GET_BY_DATE_RANGE, payload);
  }
} 