import { Request, Response } from 'express';
import { Exercise } from '../models/Exercise';
import { KPI } from '../models/KPI';
import { TrainingTemplate } from '../models/TrainingTemplate';
import { SharedResource } from '../models/SharedResource';
import { AuthRequest } from '../../shared/middleware/auth';
import { createResponse } from '../../shared/utils/response.utils';
import { ResourceType } from '../types';
import { EventService } from '../../shared';
import { 
  createExerciseSchema, 
  createTemplateSchema, 
  shareResourceSchema,
  updateExerciseSchema,
  updateKpiSchema,
  updateTemplateSchema
} from '../validation';

export class ExerciseController {
  constructor(
    private readonly exerciseModel: typeof Exercise,
    private readonly kpiModel: typeof KPI,
    private readonly templateModel: typeof TrainingTemplate,
    private readonly sharedResourceModel: typeof SharedResource,
    private readonly eventService: EventService,
  ) {}

  async createExercise(req: AuthRequest, res: Response) {
    // Validate request body
    const validatedData = await createExerciseSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    }).catch(err => {
      console.error('Exercise validation failed:', err.errors);
      res.status(400).json(
        createResponse('fail', 'Validation failed', null, {
          message: 'Invalid input',
          details: err.errors
        })
      );
      return null;
    });

    if (!validatedData) return;

    // Create exercise
    const exercise = await this.exerciseModel.create({
      ...validatedData,
      createdBy: req.user._id
    });

    // Create KPIs if provided
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

    res.status(201).json(
      createResponse('success', 'Exercise created successfully', { exercise })
    );
  }

  async createTemplate(req: AuthRequest, res: Response) {
    // Validate request body
    const validatedData = await createTemplateSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    }).catch(err => {
      console.error('Template validation failed:', err.errors);
      res.status(400).json(
        createResponse('fail', 'Validation failed', null, {
          message: 'Invalid input',
          details: err.errors
        })
      );
      return null;
    });

    if (!validatedData) return;

    const template = await this.templateModel.create({
      ...validatedData,
      createdBy: req.user._id
    });

    await this.eventService.publishDomainEvent({
      eventName: 'template.created',
      payload: { templateId: template._id }
    });

    res.status(201).json(
      createResponse('success', 'Template created successfully', { template })
    );
  }

  async shareResource(req: AuthRequest, res: Response) {
    // Validate request body
    const validatedData = await shareResourceSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    }).catch(err => {
      console.error('Share resource validation failed:', err.errors);
      res.status(400).json(
        createResponse('fail', 'Validation failed', null, {
          message: 'Invalid input',
          details: err.errors
        })
      );
      return null;
    });

    if (!validatedData) return;

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
        res.status(400).json(
          createResponse('fail', 'Invalid resource type', null)
        );
        return;
    }

    if (!resource) {
      res.status(404).json(
        createResponse('fail', 'Resource not found', null)
      );
      return;
    }

    const sharedResource = await this.sharedResourceModel.create({
      ...validatedData,
      sharedById: req.user._id
    });

    await this.eventService.publishDomainEvent({
      eventName: 'resource.shared',
      payload: { 
        resourceId: sharedResource.resourceId,
        resourceType: sharedResource.resourceType
      }
    });

    res.status(201).json(
      createResponse('success', 'Resource shared successfully', { sharedResource })
    );
  }

  async updateExercise(req: AuthRequest, res: Response) {
    const exerciseId = req.params.id;

    // Validate request body
    const validatedData = await updateExerciseSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    }).catch(err => {
      console.error('Exercise update validation failed:', err.errors);
      res.status(400).json(
        createResponse('fail', 'Validation failed', null, {
          message: 'Invalid input',
          details: err.errors
        })
      );
      return null;
    });

    if (!validatedData) return;

    // Find and update exercise
    const exercise = await this.exerciseModel.findOneAndUpdate(
      { _id: exerciseId, createdBy: req.user._id },
      validatedData,
      { new: true }
    );

    if (!exercise) {
      return res.status(404).json(
        createResponse('fail', 'Exercise not found or unauthorized')
      );
    }

    await this.eventService.publishDomainEvent({
      eventName: 'exercise.updated',
      payload: { exerciseId: exercise._id }
    });

    res.json(
      createResponse('success', 'Exercise updated successfully', { exercise })
    );
  }

  async updateKpi(req: AuthRequest, res: Response) {
    const kpiId = req.params.id;

    // Validate request body
    const validatedData = await updateKpiSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    }).catch(err => {
      console.error('KPI update validation failed:', err.errors);
      res.status(400).json(
        createResponse('fail', 'Validation failed', null, {
          message: 'Invalid input',
          details: err.errors
        })
      );
      return null;
    });

    if (!validatedData) return;

    // Find KPI and its associated exercise
    const kpi = await this.kpiModel.findById(kpiId);
    if (!kpi) {
      return res.status(404).json(
        createResponse('fail', 'KPI not found')
      );
    }

    // Verify ownership through exercise
    const exercise = await this.exerciseModel.findById(kpi.exerciseId);
    if (!exercise || exercise.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json(
        createResponse('fail', 'Unauthorized to modify this KPI')
      );
    }

    // Update KPI
    const updatedKpi = await this.kpiModel.findByIdAndUpdate(
      kpiId,
      validatedData,
      { new: true }
    );

    await this.eventService.publishDomainEvent({
      eventName: 'kpi.updated',
      payload: { kpiId: updatedKpi!._id }
    });

    res.json(
      createResponse('success', 'KPI updated successfully', { kpi: updatedKpi })
    );
  }

  async updateTemplate(req: AuthRequest, res: Response) {
    const templateId = req.params.id;

    // Validate request body
    const validatedData = await updateTemplateSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    }).catch(err => {
      console.error('Template update validation failed:', err.errors);
      res.status(400).json(
        createResponse('fail', 'Validation failed', null, {
          message: 'Invalid input',
          details: err.errors
        })
      );
      return null;
    });

    if (!validatedData) return;

    // Find and update template
    const template = await this.templateModel.findOneAndUpdate(
      { _id: templateId, createdBy: req.user._id },
      validatedData,
      { new: true }
    );

    if (!template) {
      return res.status(404).json(
        createResponse('fail', 'Template not found or unauthorized')
      );
    }

    await this.eventService.publishDomainEvent({
      eventName: 'template.updated',
      payload: { templateId: template._id }
    });

    res.json(
      createResponse('success', 'Template updated successfully', { template })
    );
  }

  async deleteSharedResource(req: AuthRequest, res: Response) {
    const sharedResourceId = req.params.id;

    // Find the shared resource
    const sharedResource = await this.sharedResourceModel.findById(sharedResourceId);

    if (!sharedResource) {
      return res.status(404).json(
        createResponse('fail', 'Shared resource not found')
      );
    }

    // Verify that the user is either the one who shared it or the one it was shared with
    if (
      sharedResource.sharedById.toString() !== req.user._id.toString() &&
      sharedResource.sharedWithId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json(
        createResponse('fail', 'Unauthorized to delete this shared resource')
      );
    }

    // Delete the shared resource
    await this.sharedResourceModel.findByIdAndDelete(sharedResourceId);

    await this.eventService.publishDomainEvent({
      eventName: 'resource.unshared',
      payload: { 
        resourceId: sharedResource.resourceId,
        resourceType: sharedResource.resourceType
      }
    });

    res.json(
      createResponse('success', 'Shared resource deleted successfully')
    );
  }
} 