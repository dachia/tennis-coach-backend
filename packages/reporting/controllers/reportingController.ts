import { Response } from 'express';
import { AuthRequest } from '../../shared/middleware/auth';
import { createResponse } from '../../shared/utils/response.utils';
import { ReportingService } from '../services/reportingService';

export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

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