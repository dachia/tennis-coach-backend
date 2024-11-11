import { ISharedResource } from '../models/SharedResource';
import { IUser } from '../../auth/models/User';
import { 
  ExerciseWithKPIsDTO, 
  GetExerciseByIdResponseDTO,
  GetTemplateByIdResponseDTO,
  GetResourceSharesResponseDTO,
  GetTemplatesResponseDTO,
  GetExercisesResponseDTO
} from '../types';

export const mapExerciseToDTO = (exercise: any, userId: string): ExerciseWithKPIsDTO => ({
  _id: exercise._id.toString(),
  title: exercise.title,
  description: exercise.description,
  media: exercise.media,
  createdBy: exercise.createdBy.toString(),
  isShared: exercise.createdBy.toString() !== userId.toString(),
  isArchived: exercise.isArchived,
  kpis: exercise.kpis?.map(mapKPIToDTO) || [],
  createdAt: exercise.createdAt,
  updatedAt: exercise.updatedAt
});

export const mapKPIToDTO = (kpi: any) => ({
  _id: kpi._id.toString(),
  goalValue: kpi.goalValue,
  unit: kpi.unit,
  performanceGoal: kpi.performanceGoal,
  exerciseId: kpi.exerciseId.toString()
});

export const mapExerciseToDetailedResponse = (exercise: any, userId: string): GetExerciseByIdResponseDTO => ({
  exercise: {
    ...exercise,
    _id: exercise._id.toString(),
    createdBy: exercise.createdBy.toString(),
    isShared: exercise.createdBy.toString() !== userId.toString(),
    kpis: exercise.kpis!.map(mapKPIToDTO)
  }
});

export const mapTemplateToDetailedResponse = (template: any, userId: string): GetTemplateByIdResponseDTO => ({
  template: {
    ...template,
    _id: template._id.toString(),
    createdBy: template.createdBy.toString(),
    isShared: template.createdBy.toString() !== userId.toString(),
    exerciseIds: template.exerciseIds.map((id: any) => id.toString()),
    exercises: template.exercises.map((exercise: any) => mapExerciseToDTO(exercise, userId))
  }
});

export const mapSharesToResponse = (shares: Array<Omit<ISharedResource, 'sharedWithId'> & { sharedWithId: IUser }>): GetResourceSharesResponseDTO => ({
  shares: shares.map(share => ({
    _id: share._id.toString(),
    email: share.sharedWithId.email,
    name: share.sharedWithId.name,
    sharedAt: share.createdAt
  }))
});

export const mapTemplateWithExercisesToDTO = (template: any, userId: string) => ({
  _id: template._id.toString(),
  title: template.title,
  description: template.description,
  createdBy: template.createdBy.toString(),
  isShared: template.isShared,
  exercises: template.exerciseIds.map((exercise: any) => mapExerciseToDTO(exercise, userId)),
  createdAt: template.createdAt,
  updatedAt: template.updatedAt
});

export const mapTemplatesToResponse = (
  ownedTemplates: any[], 
  sharedTemplates: any[], 
  userId: string
): GetTemplatesResponseDTO => ({
  templates: [
    ...ownedTemplates.map(template => mapTemplateWithExercisesToDTO({ ...template, isShared: false }, userId)),
    ...sharedTemplates.map(template => mapTemplateWithExercisesToDTO({ ...template, isShared: true }, userId))
  ]
});

export const mapExercisesWithKPIsToResponse = (
  ownedExercises: any[], 
  sharedExercises: any[], 
  userId: string
): GetExercisesResponseDTO => ({
  exercises: [
    ...ownedExercises.map(exercise => mapExerciseToDTO(exercise, userId)),
    ...sharedExercises.map(exercise => mapExerciseToDTO(exercise, userId))
  ]
}); 