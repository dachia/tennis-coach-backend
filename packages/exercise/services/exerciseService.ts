import { Exercise, IExercise } from '../models/Exercise';
import { IKPI, KPI } from '../models/KPI';
import { ITrainingTemplate, TrainingTemplate } from '../models/TrainingTemplate';
import { ISharedResource, SharedResource } from '../models/SharedResource';
import {
  ResourceType,
  CreateExerciseDTO,
  CreateTemplateDTO,
  ShareResourceDTO,
  UpdateExerciseDTO,
  UpdateKpiDTO,
  UpdateTemplateDTO,
  UpdateExerciseWithKPIsDTO,
} from '../types';
import { AuthError, EventService } from '../../shared';
import { DomainError } from '../../shared/errors/DomainError';
import {
  createExerciseSchema,
  createTemplateSchema,
  shareResourceSchema,
  updateExerciseSchema,
  updateKpiSchema,
  updateTemplateSchema,
  updateExerciseWithKPIsSchema
} from '../validation';

export class ExerciseService {
  constructor(
    private readonly exerciseModel: typeof Exercise,
    private readonly kpiModel: typeof KPI,
    private readonly templateModel: typeof TrainingTemplate,
    private readonly sharedResourceModel: typeof SharedResource,
    private readonly eventService: EventService,
  ) { }

  async createExerciseWithKPIs(data: CreateExerciseDTO): Promise<{ exercise: IExercise }> {
    let validatedData;
    try {
      validatedData = await createExerciseSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });
    } catch (err: any) {
      throw new DomainError(err.message);
    }

    const exercise = await this.exerciseModel.create({
      ...validatedData,
      createdBy: data.userId
    });

    if (validatedData.kpis?.length) {
      await Promise.all(validatedData.kpis.map(kpi =>
        this.kpiModel.create({
          ...kpi,
          exerciseId: exercise._id
        })
      ));
    }

    const populatedExercise = await this.exerciseModel
      .findById(exercise._id)
      .populate('kpis')
      .exec();

    await this.eventService.publishDomainEvent({
      eventName: 'exercise.created',
      payload: { exerciseId: exercise._id }
    });

    return { exercise: populatedExercise! };
  }

  async createTemplate(data: CreateTemplateDTO): Promise<{ template: ITrainingTemplate }> {
    let validatedData;
    try {
      validatedData = await createTemplateSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });
    } catch (err: any) {
      throw new DomainError(err.message);
    }
    // Validate that all exercises exist if exerciseIds are provided
    if (validatedData.exerciseIds?.length) {
      const exercises = await this.exerciseModel.find({
        _id: { $in: validatedData.exerciseIds }
      });

      if (exercises.length !== validatedData.exerciseIds.length) {
        throw new DomainError('One or more exercises not found');
      }
    }

    const template = await this.templateModel.create({
      ...validatedData,
      createdBy: data.userId
    });

    await this.eventService.publishDomainEvent({
      eventName: 'template.created',
      payload: { templateId: template._id }
    });

    return { template };
  }

  async shareResource(data: ShareResourceDTO): Promise<{ sharedResource: ISharedResource }> {
    let validatedData;
    try {
      validatedData = await shareResourceSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });
    } catch (err: any) {
      throw new DomainError(err.message);
    }

    // Validate that the resource exists
    let resource;
    switch (validatedData.resourceType) {
      case ResourceType.EXERCISE:
        resource = await this.exerciseModel.findById(validatedData.resourceId);
        break;
      case ResourceType.TEMPLATE:
        resource = await this.templateModel.findById(validatedData.resourceId)
          .populate('exerciseIds')
          .exec();
        break;
      default:
        throw new DomainError('Invalid resource type');
    }

    if (!resource) {
      throw new DomainError('Resource not found', 404);
    }

    const sharedResource = await this.sharedResourceModel.create({
      ...validatedData,
      sharedById: data.userId
    });

    // If sharing a template, also share all exercises within it
    if (validatedData.resourceType === ResourceType.TEMPLATE) {
      // Fetch template details to ensure we have all exercise IDs
      const template = await this.templateModel.findById(validatedData.resourceId)
        .lean();
      // Check if any exercises are already shared with this user
      const existingShares = await this.sharedResourceModel.find({
        resourceId: { $in: template!.exerciseIds },
        sharedWithId: validatedData.sharedWithId,
        resourceType: ResourceType.EXERCISE
      });

      // Filter out already shared exercise IDs
      const existingSharedIds = existingShares.map(share => 
        share.resourceId.toString()
      );
      const unsharedExerciseIds = template!.exerciseIds.filter(id => 
        !existingSharedIds.includes(id.toString())
      );

      const promises = unsharedExerciseIds.map(async (exerciseId) =>
        this.sharedResourceModel.create({
          resourceId: exerciseId,
          resourceType: ResourceType.EXERCISE,
          sharedWithId: validatedData.sharedWithId,
          sharedById: data.userId,
        })
      );
      await Promise.all(promises);
    }

    await this.eventService.publishDomainEvent({
      eventName: 'resource.shared',
      payload: {
        resourceId: sharedResource.resourceId,
        resourceType: sharedResource.resourceType
      }
    });

    return { sharedResource };
  }

  async updateExercise(id: string, data: UpdateExerciseDTO): Promise<{ exercise: IExercise | null }> {
    let validatedData;
    try {
      validatedData = await updateExerciseSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });
    } catch (err: any) {
      throw new DomainError(err.message);
    }

    const exercise = await this.exerciseModel.findOneAndUpdate(
      { _id: id, createdBy: data.userId },
      validatedData,
      { new: true }
    );

    if (!exercise) {
      throw new DomainError('Exercise not found or unauthorized', 404);
    }

    await this.eventService.publishDomainEvent({
      eventName: 'exercise.updated',
      payload: { exerciseId: exercise._id }
    });

    return { exercise };
  }

  async updateKpi(id: string, data: UpdateKpiDTO): Promise<{ kpi: IKPI | null }> {
    let validatedData;
    try {
      validatedData = await updateKpiSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });
    } catch (err: any) {
      throw new DomainError(err.message);
    }

    const kpi = await this.kpiModel.findById(id);
    if (!kpi) {
      throw new DomainError('KPI not found', 404);
    }

    const exercise = await this.exerciseModel.findById(kpi.exerciseId);
    if (!exercise || exercise.createdBy.toString() !== data.userId.toString()) {
      throw new AuthError('Unauthorized to modify this KPI', 403);
    }

    const updatedKpi = await this.kpiModel.findByIdAndUpdate(
      id,
      validatedData,
      { new: true }
    );

    await this.eventService.publishDomainEvent({
      eventName: 'kpi.updated',
      payload: { kpiId: updatedKpi!._id }
    });

    return { kpi: updatedKpi };
  }

  async updateTemplate(id: string, data: UpdateTemplateDTO): Promise<{ template: ITrainingTemplate | null }> {
    let validatedData;
    try {
      validatedData = await updateTemplateSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });
    } catch (err: any) {
      throw new DomainError(err.message);
    }
    // Validate that all exercises exist if exerciseIds are provided
    if (validatedData.exerciseIds?.length) {
      const exercises = await this.exerciseModel.find({
        _id: { $in: validatedData.exerciseIds }
      });

      if (exercises.length !== validatedData.exerciseIds.length) {
        throw new DomainError('One or more exercises not found');
      }
    }

    const template = await this.templateModel.findOneAndUpdate(
      { _id: id, createdBy: data.userId },
      validatedData,
      { new: true }
    );

    if (!template) {
      throw new DomainError('Template not found or unauthorized', 404);
    }

    await this.eventService.publishDomainEvent({
      eventName: 'template.updated',
      payload: { templateId: template._id }
    });

    return { template };
  }

  async deleteSharedResource(id: string, userId: string): Promise<boolean> {
    const sharedResource = await this.sharedResourceModel.findById(id);

    if (!sharedResource) {
      throw new DomainError('Shared resource not found', 404);
    }

    if (
      sharedResource.sharedById.toString() !== userId.toString() &&
      sharedResource.sharedWithId.toString() !== userId.toString()
    ) {
      throw new AuthError('Unauthorized to delete this shared resource', 403);
    }

    await this.sharedResourceModel.findByIdAndDelete(id);

    await this.eventService.publishDomainEvent({
      eventName: 'resource.unshared',
      payload: {
        resourceId: sharedResource.resourceId,
        resourceType: sharedResource.resourceType
      }
    });

    return true;
  }

  async updateExerciseWithKPIs(id: string, data: UpdateExerciseWithKPIsDTO): Promise<{ exercise: IExercise | null }> {
    let validatedData;
    try {
      validatedData = await updateExerciseWithKPIsSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });
    } catch (err: any) {
      throw new DomainError(err.message);
    }

    const { kpis, ...exerciseData } = validatedData;

    // First update the exercise
    const exercise = await this.exerciseModel.findOneAndUpdate(
      { _id: id, createdBy: data.userId },
      exerciseData,
      { new: true }
    );

    if (!exercise) {
      throw new DomainError('Exercise not found or unauthorized', 404);
    }

    if (kpis) {
      // Get existing KPIs
      const existingKPIs = await this.kpiModel.find({ exerciseId: id });
      const existingKPIMap = new Map(existingKPIs.map(kpi => [kpi._id.toString(), kpi]));

      // Process KPI updates
      const kpiPromises = kpis.map(async kpi => {
        if (kpi._id) {
          // Update existing KPI
          if (existingKPIMap.has(kpi._id)) {
            return this.kpiModel.findByIdAndUpdate(
              kpi._id,
              { ...kpi, exerciseId: id },
              { new: true }
            );
          }
          throw new DomainError(`KPI with id ${kpi._id} not found`);
        }
        // Create new KPI
        return this.kpiModel.create({
          ...kpi,
          exerciseId: id
        });
      });

      // Delete KPIs that are not in the update
      const updatedKPIIds = new Set(kpis.filter(k => k._id).map(k => k._id));
      const deletePromises = Array.from(existingKPIMap.keys())
        .filter(kpiId => !updatedKPIIds.has(kpiId))
        .map(kpiId => this.kpiModel.findByIdAndDelete(kpiId));

      // Execute all KPI operations
      await Promise.all([...kpiPromises, ...deletePromises]);
    }

    await this.eventService.publishDomainEvent({
      eventName: 'exercise.updated',
      payload: { exerciseId: exercise._id }
    });

    return { exercise };
  }


  async deleteExercise(id: string, userId: string): Promise<boolean> {
    const exercise = await this.exerciseModel.findOne({ _id: id, createdBy: userId });

    if (!exercise) {
      throw new DomainError('Exercise not found or unauthorized', 404);
    }

    // Set isArchived to true instead of deleting
    await this.exerciseModel.findByIdAndUpdate(id, { isArchived: true });

    await this.eventService.publishDomainEvent({
      eventName: 'exercise.archived',
      payload: { exerciseId: id }
    });

    return true;
  }

  async deleteTemplate(id: string, userId: string): Promise<boolean> {
    const template = await this.templateModel.findOne({ _id: id, createdBy: userId });

    if (!template) {
      throw new DomainError('Template not found or unauthorized', 404);
    }

    await this.templateModel.findByIdAndDelete(id);

    await this.eventService.publishDomainEvent({
      eventName: 'template.deleted',
      payload: { templateId: id }
    });

    return true;
  }
}
