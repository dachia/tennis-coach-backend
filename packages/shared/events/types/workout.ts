import { DomainEvent } from '../eventService';
import { WorkoutStatus, ExerciseLogStatus } from '../../../workout/types';

export namespace WorkoutEvents {
  export interface WorkoutCreated extends DomainEvent<"workout.created", {
    workoutId: string;
    templateId?: string;
  }> { }

  export interface WorkoutUpdated extends DomainEvent<"workout.updated", {
    workoutId: string;
    status?: WorkoutStatus;
    endTimestamp?: Date;
  }> { }

  export interface ExerciseLogCreated extends DomainEvent<"exerciseLog.created", {
    exerciseLogId: string;
    workoutId: string;
    exerciseId: string;
    userId: string;
    kpiId: string;
  }> { }

  export interface ExerciseLogUpdated extends DomainEvent<"exerciseLog.updated", {
    exerciseLogId: string;
    actualValue?: number;
    status?: ExerciseLogStatus;
    kpiId: string;
    userId: string;
  }> { }

  export interface ExerciseLogDeleted extends DomainEvent<"exerciseLog.deleted", {
    exerciseLogId: string;
    workoutId: string;
    exerciseId: string;
    kpiId: string;
    userId: string;
  }> { }

  export type WorkoutDomainEvents =
    | WorkoutCreated
    | WorkoutUpdated
    | ExerciseLogCreated
    | ExerciseLogUpdated
    | ExerciseLogDeleted;
} 