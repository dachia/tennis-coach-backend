import { Express } from 'express';
import { bootstrapApp as bootstrapExpress, Container } from '../shared';
import { addToContainer as addAuthServicesToContainer } from '../auth/di';
import { addToContainer as addExerciseServicesToContainer } from '../exercise/di';
import { addToContainer as addWorkoutServicesToContainer } from '../workout/di';
import { addToContainer as addReportingServicesToContainer } from '../reporting/di';
import { addToContainer as addMediaServicesToContainer } from '../media/di';
import { buildRoutes as buildAuthRoutes } from '../auth/routes';
import { buildRoutes as buildExerciseRoutes } from '../exercise/routes';
import { buildRoutes as buildWorkoutRoutes } from '../workout/routes';
import { buildRoutes as buildReportingRoutes } from '../reporting/routes';
import { buildRoutes as buildMediaRoutes } from '../media/routes';
import { connectToDatabase } from '../shared/utils/db';
import { AuthTransportRouter } from '../auth/transport/authTransportRouter';
import { ExerciseTransportRouter } from '../exercise/transport/exerciseTransportRouter';
import { WorkoutTransportRouter } from '../workout/transport/workoutTransportRouter';
import { ReportingTransportRouter } from '../reporting/transport/reportingTransportRouter';
import { PlanningTransportRouter } from '../planning/transport/planningTransportRouter';
import { addToContainer as addPlanningServicesToContainer } from '../planning/di';
import { buildRoutes as buildPlanningRoutes } from '../planning/routes';
import { addToContainer as addCalendarServicesToContainer } from '../calendar/di';
import { buildRoutes as buildCalendarRoutes } from '../calendar/routes';
import { CalendarTransportRouter } from '../calendar/transport/calendarTransportRouter';

interface AppConfig {
  mongoUri: string;
  jwtSecret: string;
}

export async function bootstrapApp(config: AppConfig, container: Container) {
  // Initialize Express app with base middleware
  const app: Express = bootstrapExpress();

  // Add services to container
  addAuthServicesToContainer(container);
  addExerciseServicesToContainer(container);
  addWorkoutServicesToContainer(container);
  addReportingServicesToContainer(container);
  addMediaServicesToContainer(container);
  addPlanningServicesToContainer(container);
  addCalendarServicesToContainer(container);
  // Connect to database
  await connectToDatabase(config.mongoUri);

  // Mount routes
  app.use('/auth', buildAuthRoutes(container));
  app.use('/exercise', buildExerciseRoutes(container));
  app.use('/workout', buildWorkoutRoutes(container));
  app.use('/reporting', buildReportingRoutes(container));
  app.use('/media', buildMediaRoutes(container));
  app.use('/planning', buildPlanningRoutes(container));
  app.use('/calendar', buildCalendarRoutes(container));
  // Start transport listeners
  const authTransportRouter = container.get<AuthTransportRouter>('AuthTransportRouter');
  const exerciseTransportRouter = container.get<ExerciseTransportRouter>('ExerciseTransportRouter');
  const workoutTransportRouter = container.get<WorkoutTransportRouter>('WorkoutTransportRouter');
  const reportingTransportRouter = container.get<ReportingTransportRouter>('ReportingTransportRouter');
  const planningTransportRouter = container.get<PlanningTransportRouter>('PlanningTransportRouter');
  const calendarTransportRouter = container.get<CalendarTransportRouter>('CalendarTransportRouter');
  await Promise.all([
    authTransportRouter.listen(),
    exerciseTransportRouter.listen(),
    workoutTransportRouter.listen(),
    reportingTransportRouter.listen(),
    planningTransportRouter.listen(),
    calendarTransportRouter.listen()
  ]);

  return app;
}
