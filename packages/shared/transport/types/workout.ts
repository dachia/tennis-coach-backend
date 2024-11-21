import { BaseRequest } from './base';
import { WorkoutStatus, ExerciseLogStatus } from '../../../workout/types';
import { ResponsePayload } from '../../utils';
import { PerformanceGoal } from "../../constants/PerformanceGoal";

export namespace WorkoutTransport {
  // Common interfaces
  export interface ExerciseLog {
    _id: string;
    workoutId: string;
    exerciseId: string;
    kpiId: string;
    traineeId: string;
    logDate: Date;
    actualValue: number;
    status: ExerciseLogStatus;
    notes?: string;
    media?: string[];
    // Denormalized data
    exerciseTitle: string;
    exerciseDescription: string;
    kpiUnit: string;
    kpiPerformanceGoal: PerformanceGoal;
    kpiTags?: string[];
    traineeName?: string;
    traineeEmail?: string;
    createdAt: Date;
  }

  export interface Workout {
    _id: string;
    name: string;
    startTimestamp: Date;
    endTimestamp?: Date;
    status: WorkoutStatus;
    templateId?: string;
    notes?: string;
    traineeId: string;
    traineeName: string;
    traineeEmail: string;
  }

  // Workout Operations
  export interface CreateWorkoutRequest extends BaseRequest {
    name: string;
    workoutDate: Date;
    startTimestamp: Date;
    templateId?: string;
    notes?: string;
  }

  export interface CreateWorkoutResponse extends ResponsePayload<{
    workout: Workout;
  }> {}

  export interface UpdateWorkoutRequest extends BaseRequest {
    id: string;
    status?: WorkoutStatus;
    notes?: string;
    endTimestamp?: Date;
  }

  export interface UpdateWorkoutResponse extends ResponsePayload<{
    workout: Workout;
  }> {}

  // Exercise Log Operations
  export interface CreateExerciseLogRequest extends BaseRequest {
    workoutId: string;
    exerciseId: string;
    kpiId?: string;
    actualValue: number;
    duration?: number;
    kpiTags?: string[];
  }

  export interface CreateExerciseLogResponse extends ResponsePayload<{
    exerciseLog: ExerciseLog;
  }> {}

  export interface UpdateExerciseLogRequest extends BaseRequest {
    id: string;
    actualValue?: number;
    duration?: number;
    status?: ExerciseLogStatus;
  }

  export interface UpdateExerciseLogResponse extends ResponsePayload<{
    exerciseLog: ExerciseLog;
  }> {}

  export interface GetExerciseLogRequest extends BaseRequest {
    id: string;
  }

  export interface GetExerciseLogResponse extends ResponsePayload<{
    exerciseLog: ExerciseLog;
  }> {}

  export interface GetExerciseLogsByDateRangeRequest extends BaseRequest {
    startDate: string;
    endDate: string;
    kpiId: string;
  }

  export interface GetExerciseLogsByDateRangeResponse extends ResponsePayload<{
    exerciseLogs: ExerciseLog[];
  }> {}

  // Add these interfaces to the WorkoutTransport namespace
  export interface GetWorkoutsByDateRangeRequest extends BaseRequest {
    startDate: string;
    endDate: string;
    traineeId?: string;
  }

  export interface GetWorkoutsByDateRangeResponse extends ResponsePayload<{
    workouts: Workout[];
  }> {}

  export interface GetExerciseLogsByExerciseIdRequest extends BaseRequest {
    exerciseId: string;
  }

  export interface GetExerciseLogsByExerciseIdResponse extends ResponsePayload<{
    exerciseLogs: ExerciseLog[];
  }> {}
} 