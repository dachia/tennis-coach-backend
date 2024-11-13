import { Response } from 'express';
import { AuthRequest } from '../../shared';
import { PlanningService } from '../services/planningService';
import { PlanningQueryService } from '../services/planningQueryService';
import { createResponse } from '../../shared/utils';

export class PlanningController {
  constructor(
    private readonly planningService: PlanningService,
    private readonly planningQueryService: PlanningQueryService
  ) {}

  async createPlan(req: AuthRequest, res: Response) {
    const result = await this.planningService.createPlan({
      ...req.body,
      userId: req.user._id
    });

    res.status(201).json(
      createResponse('success', 'Plan created successfully', result)
    );
  }

  async updatePlan(req: AuthRequest, res: Response) {
    const result = await this.planningService.updatePlan(
      req.params.id,
      {
        ...req.body,
        userId: req.user._id
      }
    );

    res.json(
      createResponse('success', 'Plan updated successfully', result)
    );
  }

  async deletePlan(req: AuthRequest, res: Response) {
    const result = await this.planningService.deletePlan(
      req.params.id,
      req.user._id
    );

    res.json(
      createResponse('success', 'Plan deleted successfully', result)
    );
  }

  async getPlan(req: AuthRequest, res: Response) {
    const result = await this.planningQueryService.getPlanById(
      req.params.id,
      req.user._id
    );

    res.json(
      createResponse('success', 'Plan retrieved successfully', result)
    );
  }

  async getPlans(req: AuthRequest, res: Response) {
    const result = await this.planningQueryService.getPlansForUser(
      req.user._id
    );

    res.json(
      createResponse('success', 'Plans retrieved successfully', result)
    );
  }

  async getTraineePlans(req: AuthRequest, res: Response) {
    const result = await this.planningQueryService.getPlansForTrainee(
      req.params.traineeId,
      req.user._id
    );

    res.json(
      createResponse('success', 'Trainee plans retrieved successfully', result)
    );
  }
} 