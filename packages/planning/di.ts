import { Container } from '../shared/di/container';
import { EventService } from '../shared/events/eventService';
import { Transport, WorkoutTransportClient } from '../shared/transport';
import { AuthTransportClient } from '../shared/transport/helpers/authTransport';
import { ExerciseTransportClient } from '../shared/transport/helpers/exerciseTransport';
import { PlanningController } from './controllers/planningController';
import { Plan } from './models/Plan';
import { PlanningService } from './services/planningService';
import { PlanningQueryService } from './services/planningQueryService';
import { PlanningTransportRouter } from './transport/planningTransportRouter';
import { ScheduledPlan } from './models/ScheduledPlan';

export function addToContainer(container: Container) {
  const eventService = container.get<EventService>('EventService');
  const transport = container.get<Transport>('Transport');
  const exerciseTransportClient = new ExerciseTransportClient(transport);
  const authTransportClient = new AuthTransportClient(transport);
  const planningQueryService = new PlanningQueryService(
    Plan,
    ScheduledPlan,
    authTransportClient
  );
  const workoutTransportClient = new WorkoutTransportClient(transport);

  const planningService = new PlanningService(
    Plan,
    ScheduledPlan,
    planningQueryService,
    eventService,
    exerciseTransportClient,
    authTransportClient,
    workoutTransportClient
  );

  const planningController = new PlanningController(
    planningService,
    planningQueryService
  );

  const planningTransportRouter = new PlanningTransportRouter(
    transport,
    planningService,
    planningQueryService
  );

  container.register('PlanningService', planningService);
  container.register('PlanningQueryService', planningQueryService);
  container.register('PlanningController', planningController);
  container.register('PlanningTransportRouter', planningTransportRouter);

  return container;
} 