import { Container, EventService, Transport } from "../shared";
import { WorkoutController } from "./controllers/workoutController";
import { WorkoutService } from "./services/workoutService";
import { WorkoutQueryService } from "./services/workoutQueryService";
import { WorkoutTransportRouter } from "./transport/workoutTransportRouter";
import { Workout } from "./models/Workout";
import { ExerciseLog } from "./models/ExerciseLog";

export function addToContainer(container: Container) {
  const eventService = container.get<EventService>('EventService');
  const transport = container.get<Transport>('Transport');
  
  const workoutService = new WorkoutService(
    Workout,
    ExerciseLog,
    eventService,
    transport
  );
  
  const workoutQueryService = new WorkoutQueryService(
    Workout,
    ExerciseLog,
    transport
  );
  
  const workoutController = new WorkoutController(workoutService, workoutQueryService);
  const workoutTransportRouter = new WorkoutTransportRouter(transport, workoutService, workoutQueryService);
  
  container.register('WorkoutService', workoutService);
  container.register('WorkoutQueryService', workoutQueryService);
  container.register('WorkoutController', workoutController);
  container.register('WorkoutTransportRouter', workoutTransportRouter);
  
  return container;
} 