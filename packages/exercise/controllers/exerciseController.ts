import { Request, Response } from 'express';
import { ExerciseService } from '../services/exerciseService';
import { AuthRequest } from '../../shared/middleware/auth';
import { createResponse } from '../../shared/utils/response.utils';

export class ExerciseController {
  constructor(
    private readonly exerciseService: ExerciseService
  ) {}

  async createExercise(req: AuthRequest, res: Response) {
    const result = await this.exerciseService.createExercise({
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
} 