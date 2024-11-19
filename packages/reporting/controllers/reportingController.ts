import { Response } from 'express';
import { AuthRequest } from '../../shared/middleware/auth';
import { createResponse } from '../../shared/utils/response.utils';
import { ReportingService } from '../services/reportingService';
import { ReportingQueryService } from '../services/reportingQueryService';

export class ReportingController {
  constructor(
    private readonly reportingService: ReportingService,
    private readonly reportingQueryService: ReportingQueryService
  ) {}
  
  async getProgressComparison(req: AuthRequest, res: Response) {
    const result = await this.reportingQueryService.getProgressComparison({
      logId: req.query.logId as string,
      kpiId: req.query.kpiId as string,
      userId: req.user._id
    });
    res.json(createResponse('success', 'Progress comparison fetched successfully', result));
  }

  async getProgressComparisons(req: AuthRequest, res: Response) {
    const result = await this.reportingQueryService.getProgressComparisons({
      userId: req.user._id,
      exerciseId: req.query.exerciseId as string,
      kpiId: req.query.kpiId as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
    });
    res.json(createResponse('success', 'Progress comparisons fetched successfully', result));
  }

  async calculateProgressComparison(req: AuthRequest, res: Response) {
    const result = await this.reportingService.calculateProgressComparison({
      ...req.body,
      userId: req.user._id
    });
    
    res.json(
      createResponse('success', 'Progress comparison calculated successfully', result)
    );
  }

  async calculateTotalProgress(req: AuthRequest, res: Response) {
    const result = await this.reportingService.calculateTotalProgress({
      ...req.body,
      userId: req.user._id
    });
    
    res.json(
      createResponse('success', 'Total progress calculated successfully', result)
    );
  }
} 