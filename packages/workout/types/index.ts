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
  id: string;
  traineeId: string;
  workoutDate: Date;
  startTimestamp: Date;
  endTimestamp?: Date;
  status: WorkoutStatus;
  templateId?: string;
  notes?: string;
  media?: string[];
}

export interface ExerciseLogDTO {
  id: string;
  workoutId: string;
  exerciseId: string;
  kpiId: string;
  traineeId: string;
  logDate: Date;
  actualValue: number;
  duration: number;
  status: ExerciseLogStatus;
  notes?: string;
  media?: string[];
}

export interface ProgressComparisonDTO {
  logId: string;
  comparisonValue: number;
}

export interface CreateWorkoutDTO {
  startTimestamp?: Date;
  endTimestamp?: Date;
  templateId?: string;
  notes?: string;
  media?: string[];
  userId: string;
}

export interface CreateExerciseLogDTO {
  workoutId: string;
  exerciseId: string;
  actualValue: number;
  duration: number;
  notes?: string;
  media?: string[];
  userId: string;
}

export interface UpdateWorkoutDTO {
  workoutDate?: Date;
  startTimestamp?: Date;
  endTimestamp?: Date;
  status?: WorkoutStatus;
  notes?: string;
  media?: string[];
  userId: string;
}

export interface UpdateExerciseLogDTO {
  actualValue?: number;
  duration?: number;
  status?: ExerciseLogStatus;
  notes?: string;
  media?: string[];
  userId: string;
} 