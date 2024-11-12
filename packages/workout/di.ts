import { Container, EventService, ExerciseTransportClient, Transport } from "../shared";
import { WorkoutController } from "./controllers/workoutController";
import { WorkoutService } from "./services/workoutService";
import { WorkoutQueryService } from "./services/workoutQueryService";
import { WorkoutTransportRouter } from "./transport/workoutTransportRouter";
import { Workout } from "./models/Workout";
import { ExerciseLog } from "./models/ExerciseLog";
import { AuthTransportClient } from "../shared/transport/helpers/authTransport";

export function addToContainer(container: Container) {
  const eventService = container.get<EventService>('EventService');
  const transport = container.get<Transport>('Transport');
  const exerciseTransportClient = new ExerciseTransportClient(transport);
  const authTransportClient = new AuthTransportClient(transport);
  
  const workoutService = new WorkoutService(
    Workout,
    ExerciseLog,
    eventService,
    exerciseTransportClient,
    authTransportClient
  );
  
  const workoutQueryService = new WorkoutQueryService(
    Workout,
    ExerciseLog,
    exerciseTransportClient,
    authTransportClient
  );
  
  const workoutController = new WorkoutController(workoutService, workoutQueryService);
  const workoutTransportRouter = new WorkoutTransportRouter(transport, workoutService, workoutQueryService);
  
  container.register('WorkoutService', workoutService);
  container.register('WorkoutQueryService', workoutQueryService);
  container.register('WorkoutController', workoutController);
  container.register('WorkoutTransportRouter', workoutTransportRouter);
  
  return container;
} 