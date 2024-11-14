import { BaseRequest } from './base';
import { ResponsePayload } from '../../utils/response.utils';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string
  type: 'workout' | 'plan';
  traineeId: string;
  traineeName: string;
  traineeEmail: string;
  status?: string;
}

export namespace CalendarTransport {
  export interface GetCalendarEventsRequest extends BaseRequest {
    startDate: string; // ISO date string
    endDate: string; // ISO date string
    userId: string;
    traineeId?: string;
  }

  export interface GetCalendarEventsResponse extends ResponsePayload<{
    calendarEvents: Record<string, CalendarEvent[]>;
  }> {}
} 