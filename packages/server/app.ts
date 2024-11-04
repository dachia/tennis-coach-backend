import { Express } from 'express';
import { bootstrapApp as bootstrapExpress, Container, InMemoryEventService, InMemoryEventStorage } from '../shared';
import { addToContainer } from '../auth/di';
import { buildRoutes } from '../auth/routes';
import { connectToDatabase } from '../shared/utils/db';

interface AppConfig {
  mongoUri: string;
  jwtSecret: string;
}

export async function bootstrapApp(config: AppConfig) {
  // Initialize Express app with base middleware
  const app: Express = bootstrapExpress();

  // Setup DI container
  const container = new Container();
  container.register('Config', config);

  // Setup event system
  const eventStorage = new InMemoryEventStorage();
  const eventService = new InMemoryEventService(eventStorage);
  container.register('EventService', eventService);

  // Add auth services to container
  addToContainer(container);

  // Connect to database
  await connectToDatabase(config.mongoUri);

  // Mount routes
  app.use('/auth', buildRoutes(container));

  return app;
}
