import { Exercise, IExercise } from '../models/Exercise';
import { ISharedResource, SharedResource } from '../models/SharedResource';
import { TrainingTemplate } from '../models/TrainingTemplate';
import { ResourceType } from "../../shared/constants/PerformanceGoal";
import { DomainError } from '../../shared/errors/DomainError';
import {
  GetExercisesResponseDTO,
  GetTemplatesResponseDTO,
  GetExerciseByIdResponseDTO,
  GetTemplateByIdResponseDTO,
  ExerciseWithKPIsDTO,
  GetResourceSharesResponseDTO
} from '../types';
import { IUser } from '../../auth/models/User';
import { mapExercise, mapShare, mapTemplate } from '../mappers/responseMappers';

export class ExerciseQueryService {
  constructor(
    private readonly exerciseModel: typeof Exercise,
    private readonly templateModel: typeof TrainingTemplate,
    private readonly sharedResourceModel: typeof SharedResource,
  ) { }

  async getExercisesWithKPIs(userId: string) {
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
      

    return {
      exercises: [...ownedExercises, ...sharedExercises].map(exercise => mapExercise(exercise, userId))
    };
  }

  async getTemplatesWithExercises(userId: string) {
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

    return {
      templates: [...ownedTemplates, ...sharedTemplates].map(template => mapTemplate(template, userId))
    };
  }

  async getExerciseById(id: string, userId: string) {
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

    return {
      exercise: mapExercise(exercise, userId)
    };
  }

  async getTemplateById(id: string, userId: string) {
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

    return {
      template: mapTemplate(template, userId)
    };
  }

  async getResourceShares(resourceId: string, userId: string) {
    const shares = await this.sharedResourceModel
      .find({ resourceId })
      .populate('sharedWith', '_id email name')
      .sort({ createdAt: 1 })

    return {
      shares: shares.map(share => mapShare(share))
    };
  }

  async getExercisesByIds(exerciseIds: string[], userId: string) {
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

    return {
      exercises: exercises.map(exercise => mapExercise(exercise, userId))
    };
  }
} 