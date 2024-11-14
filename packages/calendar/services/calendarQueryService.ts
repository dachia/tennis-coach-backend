import { WorkoutTransportClient } from '../../shared/transport/helpers/workoutTransport';
import { PlanningTransportClient } from '../../shared/transport/helpers/planningTransport';
import { DomainError } from '../../shared/errors';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'workout' | 'plan';
  traineeId: string;
  traineeName: string;
  traineeEmail: string;
  status?: string;
}

interface GetCalendarEventsParams {
  startDate: Date;
  endDate: Date;
  userId: string;
  traineeId?: string;
}

export class CalendarQueryService {
  constructor(
    private readonly workoutTransportClient: WorkoutTransportClient,
    private readonly planningTransportClient: PlanningTransportClient
  ) {}

  async getCalendarEvents(params: GetCalendarEventsParams): Promise<Record<string, CalendarEvent[]>> {
    const [workouts, plannedDates] = await Promise.all([
      this.fetchWorkouts(params),
      this.fetchPlans(params)
    ]);

    const events: CalendarEvent[] = [];

    // Map workouts to calendar events
    workouts.forEach(workout => {
      events.push({
        id: workout._id,
        title: workout.name,
        date: workout.startTimestamp.toISOString(),
        type: 'workout',
        traineeId: workout.traineeId,
        traineeName: workout.traineeName,
        traineeEmail: workout.traineeEmail,
        status: workout.status
      });
    });

    // Map plans to calendar events
    plannedDates.forEach(dateObj => {
      dateObj.plans.forEach(plan => {
        events.push({
          id: plan._id,
          title: plan.name,
          date: dateObj.date,
          type: 'plan',
          traineeId: plan.traineeId,
          traineeName: plan.traineeName,
          traineeEmail: plan.traineeEmail
        });
      });
    });

    // Sort events by date
    const sortedEvents = events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Reduce events into a map grouped by date
    return sortedEvents.reduce((acc, event) => {
      const dateKey = event.date.split('T')[0]; // Get YYYY-MM-DD format
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    }, {} as Record<string, CalendarEvent[]>);
  }

  private async fetchWorkouts(params: GetCalendarEventsParams) {
    const now = new Date();
    const response = await this.workoutTransportClient.getWorkoutsByDateRange({
      startDate: params.startDate.toISOString(),
      endDate: now.toISOString(),
      userId: params.userId,
      traineeId: params.traineeId
    });

    if (!response.data?.payload.workouts) {
      throw new DomainError('Failed to fetch workouts');
    }

    return response.data.payload.workouts;
  }

  private async fetchPlans(params: GetCalendarEventsParams) {
    const now = new Date();
    const response = await this.planningTransportClient.getPlannedDates({
      startDate: now.toISOString(),
      endDate: params.endDate.toISOString(),
      userId: params.userId,
      traineeId: params.traineeId
    });

    if (!response.data?.payload.plannedDates) {
      throw new DomainError('Failed to fetch planned dates');
    }

    return response.data.payload.plannedDates;
  }
} 