import { CalendarEvent } from '../../shared/transport/types/calendar';
import { WorkoutDTO } from '../../workout/types';
import { PlanDTO } from '../../shared/types';

interface PlannedDate {
  date: Date;
  plans: PlanDTO[];
}

export const mapWorkoutToCalendarEvent = (workout: WorkoutDTO): CalendarEvent => ({
  id: workout._id,
  title: workout.name,
  date: workout.startTimestamp.toISOString(),
  type: 'workout',
  traineeId: workout.traineeId,
  traineeName: workout.traineeName ?? '',
  traineeEmail: workout.traineeEmail ?? '',
  status: workout.status
});

export const mapPlanToCalendarEvent = (plan: PlanDTO, date: Date): CalendarEvent => ({
  id: plan._id,
  title: plan.name,
  date: date.toISOString(),
  type: 'plan',
  traineeId: plan.traineeId,
  traineeName: plan.traineeName,
  traineeEmail: plan.traineeEmail
});

export const mapToCalendarEvents = (
  workouts: WorkoutDTO[],
  plannedDates: PlannedDate[]
): CalendarEvent[] => {
  const events: CalendarEvent[] = [];

  // Map workouts to calendar events
  workouts.forEach(workout => {
    events.push(mapWorkoutToCalendarEvent(workout));
  });

  // Map plans to calendar events
  plannedDates.forEach(dateObj => {
    dateObj.plans.forEach(plan => {
      events.push(mapPlanToCalendarEvent(plan, dateObj.date));
    });
  });

  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}; 