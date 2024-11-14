import { Transport, TransportRouter } from '../../shared/transport';
import { CalendarQueryService } from '../services/calendarQueryService';
import { TransportRoutes } from '../../shared/transport/constants';
import { CalendarTransport } from '../../shared/transport/types/calendar';
import { createResponse } from '../../shared/utils/response.utils';

export class CalendarTransportRouter {
  private router: TransportRouter;

  constructor(
    transport: Transport,
    private readonly calendarQueryService: CalendarQueryService
  ) {
    this.router = new TransportRouter(transport);
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.register<
      CalendarTransport.GetCalendarEventsRequest,
      CalendarTransport.GetCalendarEventsResponse
    >(TransportRoutes.Calendar.GET_EVENTS, async (payload) => {
      const events = await this.calendarQueryService.getCalendarEvents({
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
        userId: payload.userId,
        traineeId: payload.traineeId
      });

      return createResponse('success', 'Calendar events fetched successfully', { calendarEvents: events });
    });
  }

  public listen() {
    return this.router.listen();
  }
} 