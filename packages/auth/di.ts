import { Container, Transport } from "../shared";
import { AuthController } from "./controllers/authController";
import { AuthService } from "./services/authService";
import { User } from "./models/User";
import { CoachTrainee } from "./models/CoachTrainee";

export function addToContainer(container: Container) {
  const config = container.get<any>('Config');
  const transport = container.get<Transport>('Transport');
  
  const authService = new AuthService(
    User,
    CoachTrainee,
    transport,
    config
  );
  
  const authController = new AuthController(authService);
  
  container.register('AuthService', authService);
  container.register('AuthController', authController);
  container.register('User', User);
  container.register('CoachTrainee', CoachTrainee);
  
  return container;
}
