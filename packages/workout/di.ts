import { Container, EventService, Transport } from "../shared";
import { WorkoutController } from "./controllers/workoutController";
import { WorkoutService } from "./services/workoutService";
import { WorkoutTransportRouter } from "./transport/workoutTransportRouter";
import { Workout } from "./models/Workout";
import { ExerciseLog } from "./models/ExerciseLog";

export function addToContainer(container: Container) {
  const eventService = container.get<EventService>('EventService');
  const transport = container.get<Transport>('Transport');
  
  const workoutService = new WorkoutService(
    Workout,
    ExerciseLog,
    eventService
  );
  
  const workoutController = new WorkoutController(workoutService);
  const workoutTransportRouter = new WorkoutTransportRouter(transport, workoutService);
  
  container.register('WorkoutService', workoutService);
  container.register('WorkoutController', workoutController);
  container.register('WorkoutTransportRouter', workoutTransportRouter);
  
  return container;
} 