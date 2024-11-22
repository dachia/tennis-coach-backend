import { Response } from 'express';
import { AuthRequest } from '../../shared/middleware/';
import { CalendarQueryService } from '../services/calendarQueryService';
import { createResponse } from '../../shared/utils/response.utils';

export class CalendarController {
  constructor(
    private readonly calendarQueryService: CalendarQueryService
  ) {}

  async getCalendarEvents(req: AuthRequest, res: Response) {
    const { startDate, endDate, traineeId, exerciseId, templateId } = req.query;

    const result = await this.calendarQueryService.getCalendarEvents({
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      userId: req.user._id,
      traineeId: traineeId as string,
      exerciseId: exerciseId as string,
      templateId: templateId as string
    });

    res.json(
      createResponse('success', 'Calendar events retrieved successfully', { calendarEvents: result })
    );
  }
} 