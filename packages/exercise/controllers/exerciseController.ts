import { Request, Response } from 'express';
import { ExerciseService } from '../services/exerciseService';
import { AuthRequest } from '../../shared/middleware/auth';
import { createResponse } from '../../shared/utils/response.utils';
import { ExerciseQueryService } from '../services/exerciseQueryService';

export class ExerciseController {
  constructor(
    private readonly exerciseService: ExerciseService,
    private readonly exerciseQueryService: ExerciseQueryService
  ) {}

  async createExercise(req: AuthRequest, res: Response) {
    const result = await this.exerciseService.createExerciseWithKPIs({
      ...req.body,
      userId: req.user._id
    });
    
    res.status(201).json(
      createResponse('success', 'Exercise created successfully', result)
    );
  }

  async createTemplate(req: AuthRequest, res: Response) {
    const result = await this.exerciseService.createTemplate({
      ...req.body,
      userId: req.user._id
    });

    res.status(201).json(
      createResponse('success', 'Template created successfully', result)
    );
  }

  async shareResource(req: AuthRequest, res: Response) {
    const result = await this.exerciseService.shareResource({
      ...req.body,
      userId: req.user._id
    });

    res.status(201).json(
      createResponse('success', 'Resource shared successfully', result)
    );
  }

  async updateExercise(req: AuthRequest, res: Response) {
    const result = await this.exerciseService.updateExercise(
      req.params.id,
      {
        ...req.body,
        userId: req.user._id
      }
    );

    res.json(
      createResponse('success', 'Exercise updated successfully', result)
    );
  }

  async updateKpi(req: AuthRequest, res: Response) {
    const result = await this.exerciseService.updateKpi(
      req.params.id,
      {
        ...req.body,
        userId: req.user._id
      }
    );

    res.json(
      createResponse('success', 'KPI updated successfully', result)
    );
  }

  async updateTemplate(req: AuthRequest, res: Response) {
    const result = await this.exerciseService.updateTemplate(
      req.params.id,
      {
        ...req.body,
        userId: req.user._id
      }
    );

    res.json(
      createResponse('success', 'Template updated successfully', result)
    );
  }

  async deleteSharedResource(req: AuthRequest, res: Response) {
    await this.exerciseService.deleteSharedResource(
      req.params.id,
      req.user._id
    );

    res.json(
      createResponse('success', 'Shared resource deleted successfully')
    );
  }

  async updateExerciseWithKPIs(req: AuthRequest, res: Response) {
    const result = await this.exerciseService.updateExerciseWithKPIs(
      req.params.id,
      {
        ...req.body,
        userId: req.user._id
      }
    );

    res.json(
      createResponse('success', 'Exercise and KPIs updated successfully', result)
    );
  }

  async getExercises(req: AuthRequest, res: Response) {
    const result = await this.exerciseQueryService.getExercisesWithKPIs(req.user._id);
    
    res.json(
      createResponse('success', 'Exercises retrieved successfully', result)
    );
  }

  async deleteExercise(req: AuthRequest, res: Response) {
    await this.exerciseService.deleteExercise(
      req.params.id,
      req.user._id
    );

    res.json(
      createResponse('success', 'Exercise deleted successfully')
    );
  }

  async getResourceShares(req: AuthRequest, res: Response) {
    const result = await this.exerciseQueryService.getResourceShares(
      req.params.id,
      req.user._id
    );

    res.json(
      createResponse('success', 'Resource shares retrieved successfully', result)
    );
  }

  async deleteTemplate(req: AuthRequest, res: Response) {
    await this.exerciseService.deleteTemplate(req.params.id, req.user._id);

    res.json(
      createResponse('success', 'Template deleted successfully')
    );
  }

  async getTemplates(req: AuthRequest, res: Response) {
    const result = await this.exerciseQueryService.getTemplatesWithExercises(req.user._id);
    
    res.json(
      createResponse('success', 'Templates retrieved successfully', result)
    );
  }

  async getExercise(req: AuthRequest, res: Response) {
    const result = await this.exerciseQueryService.getExerciseById(
      req.params.id,
      req.user._id
    );
    
    res.json(
      createResponse('success', 'Exercise retrieved successfully', result)
    );
  }

  async getTemplate(req: AuthRequest, res: Response) {
    const result = await this.exerciseQueryService.getTemplateById(
      req.params.id,
      req.user._id
    );
    
    res.json(
      createResponse('success', 'Template retrieved successfully', result)
    );
  }

  async getExercisesByIds(req: AuthRequest, res: Response) {
    const result = await this.exerciseQueryService.getExercisesByIds(req.body.ids, req.user._id);

    res.json(
      createResponse('success', 'Exercises retrieved successfully', result)
    );
  }
} 