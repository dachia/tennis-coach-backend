import { Exercise, IExercise } from '../models/Exercise';
import { ISharedResource, SharedResource } from '../models/SharedResource';
import { TrainingTemplate } from '../models/TrainingTemplate';
import { ResourceType } from '../types';
import { DomainError } from '../../shared/errors/DomainError';
import {
  GetExercisesResponseDTO,
  GetTemplatesResponseDTO,
  GetExerciseByIdResponseDTO,
  GetTemplateByIdResponseDTO,
  ExerciseWithKPIsDTO,
  GetResourceSharesResponseDTO
} from '../types';
import {
  mapExercisesWithKPIsToResponse,
  mapTemplateToDetailedResponse,
  mapTemplatesToResponse,
  mapSharesToResponse,
  mapExerciseToDetailedResponse,
  mapExerciseToDTO
} from '../mappers/responseMappers';
import { IUser } from '../../auth/models/User';

export class ExerciseQueryService {
  constructor(
    private readonly exerciseModel: typeof Exercise,
    private readonly templateModel: typeof TrainingTemplate,
    private readonly sharedResourceModel: typeof SharedResource,
  ) { }

  async getExercisesWithKPIs(userId: string): Promise<GetExercisesResponseDTO> {
    const [ownedExercises, sharedResources] = await Promise.all([
      this.exerciseModel
        .find({
          createdBy: userId,
          isArchived: false
      })
      .populate('kpis')
        .lean()
        .exec(),
      this.sharedResourceModel
        .find({
          sharedWithId: userId,
        resourceType: ResourceType.EXERCISE
        })
        .exec()
    ]);

    const sharedExerciseIds = sharedResources.map(share => share.resourceId);

    const sharedExercises = await this.exerciseModel
      .find({
        _id: { $in: sharedExerciseIds },
        isArchived: false
      })
      .populate('kpis')
      .lean()
      .exec();
      

    return mapExercisesWithKPIsToResponse(ownedExercises, sharedExercises, userId);
  }

  async getTemplatesWithExercises(userId: string): Promise<GetTemplatesResponseDTO> {
    const [ownedTemplates, sharedResources] = await Promise.all([
      this.templateModel
        .find({ createdBy: userId })
        .populate({
          path: 'exercises',
          match: { isArchived: false },
          populate: {
            path: 'kpis'
          }
        })
        .lean()
        .exec(),
      this.sharedResourceModel
        .find({
          sharedWithId: userId,
          resourceType: ResourceType.TEMPLATE
        })
        .exec()
    ]);

    const sharedTemplateIds = sharedResources.map(share => share.resourceId);

    const sharedTemplates = await this.templateModel
      .find({
        _id: { $in: sharedTemplateIds }
      })
      .populate({
        path: 'exercises',
        match: { isArchived: false },
        populate: {
          path: 'kpis'
        }
      })
      .lean()
      .exec();

    return mapTemplatesToResponse(ownedTemplates, sharedTemplates, userId);
  }

  async getExerciseById(id: string, userId: string): Promise<GetExerciseByIdResponseDTO> {
    let exercise = await this.exerciseModel
      .findOne({
        _id: id,
        createdBy: userId
      })
      .populate('kpis')
      .lean();

    if (!exercise) {
      const sharedResource = await this.sharedResourceModel.findOne({
        resourceId: id,
        sharedWithId: userId,
        resourceType: ResourceType.EXERCISE
      });

      if (sharedResource) {
        exercise = await this.exerciseModel
          .findById(id)
          .populate('kpis')
          .lean();
      }
    }

    if (!exercise) {
      throw new DomainError('Exercise not found or unauthorized', 404);
    }

    return mapExerciseToDetailedResponse(exercise, userId);
  }

  async getTemplateById(id: string, userId: string): Promise<GetTemplateByIdResponseDTO> {
    let template = await this.templateModel
      .findOne({
        _id: id,
        createdBy: userId
      })
      .populate({
        path: 'exercises',
        populate: {
          path: 'kpis'
        }
      })
      .lean();

    if (!template) {
      const sharedResource = await this.sharedResourceModel.findOne({
        resourceId: id,
        sharedWithId: userId,
        resourceType: ResourceType.TEMPLATE
      });

      if (sharedResource) {
        template = await this.templateModel
          .findById(id)
          .populate({
            path: 'exercises',
            populate: {
              path: 'kpis'
            }
          })
          .lean();
      }
    }

    if (!template) {
      throw new DomainError('Template not found or unauthorized', 404);
    }

    return mapTemplateToDetailedResponse(template, userId);
  }

  async getResourceShares(resourceId: string, userId: string): Promise<GetResourceSharesResponseDTO> {
    const shares = await this.sharedResourceModel
      .find({ resourceId })
      .populate('sharedWithId', '_id email name')
      .sort({ createdAt: 1 }) as unknown as (Omit<ISharedResource, 'sharedWithId'> & { sharedWithId: IUser })[];

    return mapSharesToResponse(shares);
  }

  async getExercisesByIds(exerciseIds: string[], userId: string): Promise<ExerciseWithKPIsDTO[]> {
    const sharedResources = await this.sharedResourceModel
      .find({
        resourceId: { $in: exerciseIds },
        sharedWithId: userId,
        resourceType: ResourceType.EXERCISE
      });

    const sharedExerciseIds = sharedResources.map(share => share.resourceId.toString());

    const exercises = await this.exerciseModel
      .find({
        _id: { $in: exerciseIds },
        // isArchived: false,
        $or: [
          { createdBy: userId },
          { _id: { $in: sharedExerciseIds } }
        ]
      })
      .populate('kpis')
      .lean();

    return exercises.map(exercise => mapExerciseToDTO(exercise, userId));
  }
} 