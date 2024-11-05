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