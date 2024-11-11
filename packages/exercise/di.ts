import { Container, EventService, Transport } from "../shared";
import { ExerciseController } from "./controllers/exerciseController";
import { ExerciseService } from "./services/exerciseService";
import { ExerciseTransportRouter } from "./transport/exerciseTransportRouter";
import { Exercise } from "./models/Exercise";
import { KPI } from "./models/KPI";
import { TrainingTemplate } from "./models/TrainingTemplate";
import { SharedResource } from "./models/SharedResource";
import { ExerciseQueryService } from "./services/exerciseQueryService";

export function addToContainer(container: Container) {
  const eventService = container.get<EventService>('EventService');
  const transport = container.get<Transport>('Transport');
  
  const exerciseService = new ExerciseService(
    Exercise,
    KPI,
    TrainingTemplate,
    SharedResource,
    eventService
  );
  
  const exerciseQueryService = new ExerciseQueryService(
    Exercise,
    TrainingTemplate,
    SharedResource
  );
  
  const exerciseController = new ExerciseController(exerciseService, exerciseQueryService);
  const exerciseTransportRouter = new ExerciseTransportRouter(transport, exerciseService, exerciseQueryService);
  
  container.register('ExerciseService', exerciseService);
  container.register('ExerciseQueryService', exerciseQueryService);
  container.register('ExerciseController', exerciseController);
  container.register('ExerciseTransportRouter', exerciseTransportRouter);
}
