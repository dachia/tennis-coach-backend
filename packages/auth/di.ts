import { Container, EventService, Transport } from "../shared";
import { AuthController } from "./controllers/authController";
import { AuthService } from "./services/authService";
import { AuthTransportRouter } from "./transport/authTransportRouter";
import { User } from "./models/User";
import { CoachTrainee } from "./models/CoachTrainee";

export function addToContainer(container: Container) {
  const config = container.get<any>('Config');
  const eventService = container.get<EventService>('EventService');
  const transport = container.get<Transport>('Transport');
  
  const authService = new AuthService(
    User,
    CoachTrainee,
    eventService,
    config
  );
  
  const authController = new AuthController(authService);
  const authTransportRouter = new AuthTransportRouter(transport, authService);
  
  container.register('AuthService', authService);
  container.register('AuthController', authController);
  container.register('AuthTransportRouter', authTransportRouter);
  
  return container;
}
