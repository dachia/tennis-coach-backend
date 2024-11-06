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
  // Connect to database
  await connectToDatabase(config.mongoUri);

  // Mount routes
  app.use('/auth', buildAuthRoutes(container));
  app.use('/exercise', buildExerciseRoutes(container));
  app.use('/workout', buildWorkoutRoutes(container));
  app.use('/reporting', buildReportingRoutes(container));
  app.use('/media', buildMediaRoutes(container));

  return app;
}
