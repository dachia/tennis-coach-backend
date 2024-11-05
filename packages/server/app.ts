import { Express } from 'express';
import { bootstrapApp as bootstrapExpress, Container } from '../shared';
import { addToContainer as addAuthServicesToContainer } from '../auth/di';
import { addToContainer as addExerciseServicesToContainer } from '../exercise/di';
import { buildRoutes as buildAuthRoutes } from '../auth/routes';
import { buildRoutes as buildExerciseRoutes } from '../exercise/routes';
import { connectToDatabase } from '../shared/utils/db';

interface AppConfig {
  mongoUri: string;
  jwtSecret: string;
}

export async function bootstrapApp(config: AppConfig, container: Container) {
  // Initialize Express app with base middleware
  const app: Express = bootstrapExpress();

  // Add auth services to container
  addAuthServicesToContainer(container);
  addExerciseServicesToContainer(container);
  // Connect to database
  await connectToDatabase(config.mongoUri);

  // Mount routes
  app.use('/auth', buildAuthRoutes(container));
  app.use('/exercise', buildExerciseRoutes(container));
  return app;
}
