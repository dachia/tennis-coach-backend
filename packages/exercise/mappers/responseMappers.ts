import { ISharedResource } from '../models/SharedResource';

// Main Exercise Mapper
export const mapExercise = (exercise: any, userId: string) => ({
  _id: exercise._id.toString(),
  title: exercise.title,
  description: exercise.description,
  media: exercise.media,
  createdBy: exercise.createdBy?.toString(),
  isShared: exercise.createdBy?.toString() !== userId.toString(),
  isArchived: exercise.isArchived,
  kpis: exercise.kpis?.map(mapKPI) || [],
  createdAt: exercise.createdAt,
  updatedAt: exercise.updatedAt,
  tags: exercise.tags ?? []
});

// Main KPI Mapper
export const mapKPI = (kpi: any) => ({
  _id: kpi._id.toString(),
  goalValue: kpi.goalValue,
  unit: kpi.unit,
  performanceGoal: kpi.performanceGoal,
  exerciseId: kpi.exerciseId.toString(),
  tags: kpi.tags ?? []
});

// Main Template Mapper
export const mapTemplate = (template: any, userId: string) => ({
  _id: template._id.toString(),
  title: template.title,
  description: template.description,
  createdBy: template.createdBy.toString(),
  isShared: template.createdBy.toString() !== userId.toString(),
  exerciseIds: template.exerciseIds?.map((id: any) => id.toString()),
  exercises: template.exercises?.map((exercise: any) => mapExercise(exercise, userId)) || [],
  createdAt: template.createdAt,
  updatedAt: template.updatedAt
});

// Main Share Mapper
export const mapShare = (share: ISharedResource) => ({
  _id: share._id.toString(),
  email: share.sharedWith?.email,
  name: share.sharedWith?.name,
  sharedAt: share.createdAt,
  resourceType: share.resourceType,
  resourceId: share.resourceId.toString(),
  sharedById: share.sharedById.toString(),
  sharedWithId: share.sharedWithId?.toString()
});
