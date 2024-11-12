import { BaseRequest } from './base';
import { WorkoutStatus, ExerciseLogStatus } from '../../../workout/types';
import { ResponsePayload } from '../../utils';

export namespace WorkoutTransport {
  // Common interfaces
  export interface ExerciseLog {
    _id: string;
    workoutId: string;
    exerciseId: string;
    kpiId?: string;
    actualValue?: number;
    duration?: number;
    status: ExerciseLogStatus;
    traineeId: string;
    logDate?: Date;
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
} 