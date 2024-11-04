import { Container, EventService } from "../shared";
import { AuthController } from "./controllers/authController";
import { User } from "./models/User";
import { CoachTrainee } from "./models/CoachTrainee";

export function addToContainer(container: Container) {
  const config = container.get<any>('Config');
  const authController = new AuthController(User, CoachTrainee, container.get<EventService>('EventService'), config);
  container.register('AuthController', authController);
  container.register('User', User);
  container.register('CoachTrainee', CoachTrainee);
  return container;
}
