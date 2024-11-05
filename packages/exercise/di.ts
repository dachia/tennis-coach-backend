import { Container, EventService } from "../shared";
import { ExerciseController } from "./controllers/exerciseController";
import { Exercise } from "./models/Exercise";
import { KPI } from "./models/KPI";
import { TrainingTemplate } from "./models/TrainingTemplate";
import { SharedResource } from "./models/SharedResource";

export function addToContainer(container: Container) {
  // const config = container.get<any>('Config');
  const exerciseController = new ExerciseController(Exercise, KPI, TrainingTemplate, SharedResource, container.get<EventService>('EventService'));
  container.register('Exercise', Exercise);
  container.register('KPI', KPI);
  container.register('TrainingTemplate', TrainingTemplate);
  container.register('SharedResource', SharedResource);
  container.register('ExerciseController', exerciseController);
  return container;
}
