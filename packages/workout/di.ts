import { Container, EventService } from "../shared";
import { WorkoutController } from "./controllers/workoutController";
import { Workout } from "./models/Workout";
import { ExerciseLog } from "./models/ExerciseLog";
import { ProgressComparison } from "./models/ProgressComparison";

export function addToContainer(container: Container) {
  const workoutController = new WorkoutController(
    Workout,
    ExerciseLog,
    ProgressComparison,
    container.get<EventService>('EventService')
  );

  container.register('Workout', Workout);
  container.register('ExerciseLog', ExerciseLog);
  container.register('ProgressComparison', ProgressComparison);
  container.register('WorkoutController', workoutController);
  
  return container;
} 