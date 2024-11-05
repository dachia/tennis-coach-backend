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
  UpdateTemplateDTO
} from '../types';
import { EventService } from '../../shared';
import { DomainError } from '../../shared/errors/DomainError';
import {
  createExerciseSchema,
  createTemplateSchema,
  shareResourceSchema,
  updateExerciseSchema,
  updateKpiSchema,
  updateTemplateSchema
} from '../validation';

export class ExerciseService {
  constructor(
    private readonly exerciseModel: typeof Exercise,
    private readonly kpiModel: typeof KPI,
    private readonly templateModel: typeof TrainingTemplate,
    private readonly sharedResourceModel: typeof SharedResource,
    private readonly eventService: EventService,
  ) {}

  async createExercise(data: CreateExerciseDTO): Promise<{ exercise: IExercise }> {
    const validatedData = await createExerciseSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

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

    await this.eventService.publishDomainEvent({
      eventName: 'exercise.created',
      payload: { exerciseId: exercise._id }
    });

    return { exercise };
  }

  async createTemplate(data: CreateTemplateDTO): Promise<{ template: ITrainingTemplate }> {
    const validatedData = await createTemplateSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

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
    const validatedData = await shareResourceSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    // Validate that the resource exists
    let resource;
    switch (validatedData.resourceType) {
      case ResourceType.EXERCISE:
        resource = await this.exerciseModel.findById(validatedData.resourceId);
        break;
      case ResourceType.TEMPLATE:
        resource = await this.templateModel.findById(validatedData.resourceId);
        break;
      default:
        throw new DomainError('Invalid resource type');
    }

    if (!resource) {
      throw new DomainError('Resource not found');
    }

    const sharedResource = await this.sharedResourceModel.create({
      ...validatedData,
      sharedById: data.userId
    });

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
    const validatedData = await updateExerciseSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    const exercise = await this.exerciseModel.findOneAndUpdate(
      { _id: id, createdBy: data.userId },
      validatedData,
      { new: true }
    );

    if (!exercise) {
      throw new DomainError('Exercise not found or unauthorized');
    }

    await this.eventService.publishDomainEvent({
      eventName: 'exercise.updated',
      payload: { exerciseId: exercise._id }
    });

    return { exercise };
  }

  async updateKpi(id: string, data: UpdateKpiDTO): Promise<{ kpi: IKPI | null }> {
    const validatedData = await updateKpiSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    const kpi = await this.kpiModel.findById(id);
    if (!kpi) {
      throw new DomainError('KPI not found');
    }

    const exercise = await this.exerciseModel.findById(kpi.exerciseId);
    if (!exercise || exercise.createdBy.toString() !== data.userId.toString()) {
      throw new DomainError('Unauthorized to modify this KPI');
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
    const validatedData = await updateTemplateSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    const template = await this.templateModel.findOneAndUpdate(
      { _id: id, createdBy: data.userId },
      validatedData,
      { new: true }
    );

    if (!template) {
      throw new DomainError('Template not found or unauthorized');
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
      throw new DomainError('Shared resource not found');
    }

    if (
      sharedResource.sharedById.toString() !== userId.toString() &&
      sharedResource.sharedWithId.toString() !== userId.toString()
    ) {
      throw new DomainError('Unauthorized to delete this shared resource');
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
}
