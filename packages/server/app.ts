import { Express } from 'express';
import { bootstrapApp as bootstrapExpress, Container } from '../shared';
import { addToContainer } from '../auth/di';
import { buildRoutes } from '../auth/routes';
import { connectToDatabase } from '../shared/utils/db';

interface AppConfig {
  mongoUri: string;
  jwtSecret: string;
}

export async function bootstrapApp(config: AppConfig, container: Container) {
  // Initialize Express app with base middleware
  const app: Express = bootstrapExpress();

  // Add auth services to container
  addToContainer(container);

  // Connect to database
  await connectToDatabase(config.mongoUri);

  // Mount routes
  app.use('/auth', buildRoutes(container));

  return app;
}
