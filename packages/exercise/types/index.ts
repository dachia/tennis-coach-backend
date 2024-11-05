export enum PerformanceGoal {
  MAXIMIZE = 'maximize',
  MINIMIZE = 'minimize'
}

export enum ResourceType {
  EXERCISE = 'exercise',
  TEMPLATE = 'template'
}

export interface ExerciseDTO {
  id: string;
  title: string;
  description: string;
  media: string[];
  createdBy: string;
}

export interface KPIDTO {
  id: string;
  exerciseId: string;
  goalValue: number;
  unit: string;
  performanceGoal: PerformanceGoal;
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
