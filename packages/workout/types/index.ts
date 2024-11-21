export enum WorkoutStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export enum ExerciseLogStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface WorkoutDTO {
  _id: string;
  traineeId: string;
  name: string;
  startTimestamp: Date;
  endTimestamp?: Date;
  status: WorkoutStatus;
  templateId?: string;
  notes?: string;
  media?: string[];
  traineeName: string;
  traineeEmail: string;
}

export interface ExerciseLogDTO {
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
  exerciseTitle?: string;
  exerciseDescription?: string;
  kpiUnit?: string;
  kpiPerformanceGoal?: string;
  traineeName?: string;
  traineeEmail?: string;
}

export interface ProgressComparisonDTO {
  logId: string;
  comparisonValue: number;
}

export interface CreateWorkoutDTO {
  startTimestamp?: Date;
  endTimestamp?: Date;
  name: string;
  templateId?: string;
  notes?: string;
  media?: string[];
  userId: string;
}

export interface CreateExerciseLogDTO {
  workoutId: string;
  exerciseId: string;
  actualValue: number;
  notes?: string;
  media?: string[];
  userId: string;
}

export interface UpdateWorkoutDTO {
  workoutDate?: Date;
  startTimestamp?: Date;
  endTimestamp?: Date;
  name?: string;
  status?: WorkoutStatus;
  notes?: string;
  media?: string[];
  userId: string;
}

export interface UpdateExerciseLogDTO {
  actualValue?: number;
  status?: ExerciseLogStatus;
  notes?: string;
  media?: string[];
  userId: string;
}
export interface ExerciseLogDTO {
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
}

export interface EnrichedExerciseLogDTO extends ExerciseLogDTO {
  exerciseName?: string;
  kpiUnit?: string;
  kpiPerformanceGoal?: string;
}

export interface EnrichedWorkoutDTO extends WorkoutDTO {
  exerciseLogs: EnrichedExerciseLogDTO[];
  exercises: {
    exerciseId: string;
    exerciseName: string;
    logs: EnrichedExerciseLogDTO[];
  }[];
}

export interface GetCompletedWorkoutsResponseDTO {
  workouts: EnrichedWorkoutDTO[];
} 