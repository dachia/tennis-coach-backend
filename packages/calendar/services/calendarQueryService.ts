import { WorkoutTransportClient } from '../../shared/transport/helpers/workoutTransport';
import { PlanningTransportClient } from '../../shared/transport/helpers/planningTransport';
import { DomainError } from '../../shared/errors';
import { getCalendarEventsSchema } from '../validation';
import { mapPlanToCalendarEvent, mapExerciseLogToCalendarEvent } from '../mappers/responseMappers';
import { CalendarEvent } from '../../shared/transport/types/calendar';
import { PlanningTransport } from '../../shared/transport/types/planning';
import { WorkoutTransport } from '../../shared/transport/types/workout';

interface GetCalendarEventsParams {
  startDate: Date;
  endDate: Date;
  userId: string;
  traineeId?: string;
  exerciseId?: string;
  templateId?: string;
}

export class CalendarQueryService {
  constructor(
    private readonly workoutTransportClient: WorkoutTransportClient,
    private readonly planningTransportClient: PlanningTransportClient
  ) {}

  async getCalendarEvents(params: GetCalendarEventsParams): Promise<Record<string, CalendarEvent[]>> {
    // Validate input parameters
    try {
      await getCalendarEventsSchema.validate(params, {
        abortEarly: false,
        stripUnknown: true
      });
    } catch (err: any) {
      throw new DomainError(err.errors.join(', '));
    }

    const [plannedDates, exerciseLogs] = await Promise.all([
      this.fetchPlans(params),
      this.fetchExerciseLogs(params)
    ]);

    const events: CalendarEvent[] = [];

    // Map workouts to calendar events
    // workouts.forEach(workout => {
    //   events.push({
    //     id: workout._id,
    //     title: workout.name,
    //     date: workout.startTimestamp.toISOString(),
    //     type: 'workout',
    //     traineeId: workout.traineeId,
    //     traineeName: workout.traineeName,
    //     traineeEmail: workout.traineeEmail,
    //     status: workout.status
    //   });
    // });

    // Map plans to calendar events
    plannedDates.forEach(dateObj => {
      dateObj.plans.forEach(plan => {
        events.push(mapPlanToCalendarEvent(plan, new Date(dateObj.date)));
      });
    });

    // Map exercise logs to calendar events
    exerciseLogs.forEach(log => {
      events.push(mapExerciseLogToCalendarEvent(log));
    });

    // Sort events by date
    const sortedEvents = events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Reduce events into a map grouped by date
    const groupedEvents = sortedEvents.reduce((acc, event) => {
      const dateKey = event.date.split('T')[0]; // Get YYYY-MM-DD format
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    }, {} as Record<string, CalendarEvent[]>);
    return groupedEvents;
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
    const query: PlanningTransport.GetPlannedDatesRequest = {
      startDate: now.toISOString(),
      endDate: params.endDate.toISOString(),
      userId: params.userId,
      traineeId: params.traineeId
    }
    if (params.exerciseId) {
      query.exerciseId = params.exerciseId;
    }
    if (params.templateId) {
      query.templateId = params.templateId;
    }
    const response = await this.planningTransportClient.getPlannedDates(query);

    if (!response.data?.payload.plannedDates) {
      throw new DomainError('Failed to fetch planned dates');
    }

    return response.data.payload.plannedDates;
  }
  
  private async fetchExerciseLogs(params: GetCalendarEventsParams) {
    const now = new Date();
    const query: WorkoutTransport.GetExerciseLogsByDateRangeRequest = {
      startDate: params.startDate.toISOString(),
      endDate: now.toISOString(),
      userId: params.userId,
    }
    if (params.exerciseId) {
      query.exerciseId = params.exerciseId;
    }
    const response = await this.workoutTransportClient.getExerciseLogsByDateRange(query);
    
    if (!response.data?.payload.exerciseLogs) {
      throw new DomainError('Failed to fetch exercise logs');
    }

    return response.data.payload.exerciseLogs;
  }
} 
