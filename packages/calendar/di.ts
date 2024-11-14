import { Container, Transport } from "../shared";
import { CalendarController } from "./controllers/calendarController";
import { CalendarQueryService } from "./services/calendarQueryService";
import { CalendarTransportRouter } from "./transport/calendarTransportRouter";
import { WorkoutTransportClient } from "../shared/transport/helpers/workoutTransport";
import { PlanningTransportClient } from "../shared/transport/helpers/planningTransport";

export function addToContainer(container: Container) {
  const transport = container.get<Transport>('Transport');
  const workoutTransportClient = new WorkoutTransportClient(transport);
  const planningTransportClient = new PlanningTransportClient(transport);
  
  const calendarQueryService = new CalendarQueryService(
    workoutTransportClient,
    planningTransportClient
  );
  
  const calendarController = new CalendarController(calendarQueryService);
  
  const calendarTransportRouter = new CalendarTransportRouter(
    transport,
    calendarQueryService
  );
  
  container.register('CalendarQueryService', calendarQueryService);
  container.register('CalendarController', calendarController);
  container.register('CalendarTransportRouter', calendarTransportRouter);
  
  return container;
} 