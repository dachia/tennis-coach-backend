import { TransportRouter } from '../../shared/transport/transportRouter';
import { Transport } from '../../shared/transport/transport';
import { AuthService } from '../services/authService';
import { LoginDTO, RegisterDTO } from '../types';

export class AuthTransportRouter {
  private router: TransportRouter;

  constructor(
    transport: Transport,
    private authService: AuthService
  ) {
    this.router = new TransportRouter(transport);
    this.registerRoutes();
  }

  private registerRoutes() {
    // Register authentication routes
    this.router.register<RegisterDTO, { token: string }>(
      'auth.register',
      async (payload) => {
        return this.authService.register(payload);
      }
    );

    this.router.register<LoginDTO, { token: string }>(
      'auth.login',
      async (payload) => {
        return this.authService.login(payload);
      }
    );

    this.router.register<string, any>(
      'auth.coach.trainees',
      async (coachId) => {
        return this.authService.getTraineesByCoach(coachId);
      }
    );

    this.router.register<string, any>(
      'auth.trainee.coach',
      async (traineeId) => {
        return this.authService.getCoachByTrainee(traineeId);
      }
    );
  }

  /**
   * Start listening for auth-related messages
   */
  async listen() {
    await this.router.listen();
  }

  /**
   * Stop listening and clean up
   */
  async close() {
    await this.router.close();
  }
} 