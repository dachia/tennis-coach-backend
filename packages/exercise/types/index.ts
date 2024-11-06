export enum PerformanceGoal {
  MAXIMIZE = 'maximize',
  MINIMIZE = 'minimize'
}

export enum ResourceType {
  EXERCISE = 'exercise',
  TEMPLATE = 'template'
}

export interface ExerciseDTO {
  _id: string;
  title: string;
  description: string;
  media: string[];
  createdBy: string;
  isShared?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KPIDTO {
  _id: string;
  goalValue: number;
  unit: string;
  performanceGoal: PerformanceGoal;
  exerciseId: string;
}

export interface TrainingTemplateDTO {
  id: string;
  title: string;
  description: string;
  createdBy: string;
}

export interface SharedResourceDTO {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  sharedWith: string;
  sharedBy: string;
}

export interface CreateExerciseDTO {
  title: string;
  description: string;
  media?: string[];
  kpis?: Array<{
    goalValue: number;
    unit: string;
    performanceGoal: PerformanceGoal;
  }>;
  userId: string;
}

export interface CreateTemplateDTO {
  title: string;
  description: string;
  exerciseIds: string[];
  userId: string;
}

export interface ShareResourceDTO {
  resourceType: ResourceType;
  resourceId: string;
  sharedWithId: string;
  userId: string;
}

export interface UpdateExerciseDTO {
  title?: string;
  description?: string;
  media?: string[];
  userId: string;
}

export interface UpdateKpiDTO {
  goalValue?: number;
  unit?: string;
  performanceGoal?: PerformanceGoal;
  userId: string;
}

export interface UpdateTemplateDTO {
  title?: string;
  description?: string;
  exerciseIds?: string[];
  userId: string;
}

export interface UpdateExerciseWithKPIsDTO extends UpdateExerciseDTO {
  kpis?: Array<{
    _id?: string;
    goalValue: number;
    unit: string;
    performanceGoal: PerformanceGoal;
  }>;
}

export interface ShareDTO {
  email: string;
  name: string;
  sharedAt: Date;
}

export interface GetResourceSharesResponseDTO {
  shares: ShareDTO[];
}

export interface ExerciseWithKPIsDTO extends ExerciseDTO {
  kpis: KPIDTO[];
}

export interface GetExercisesResponseDTO {
  exercises: Array<ExerciseWithKPIsDTO>;
}

export interface GetTemplatesResponseDTO {
  templates: Array<{
    _id: string;
    title: string;
    description: string;
    createdBy: string;
    isShared: boolean;
    exercises: Array<{
      _id: string;
      title: string;
      description: string;
      media: string[];
      kpis: Array<{
        _id: string;
        goalValue: number;
        unit: string;
        performanceGoal: string;
        exerciseId: string;
      }>;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }>;
}
