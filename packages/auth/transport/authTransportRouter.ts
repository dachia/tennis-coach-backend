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

    this.router.register<{ coachId: string }, { trainees: { _id: string; email: string; name: string }[] }>(
      'auth.coach.trainees',
      async (payload) => {
        return this.authService.getTraineesByCoach(payload.coachId);
      }
    );

    this.router.register<{ traineeId: string }, { coach: { _id: string; email: string; name: string } }>(
      'auth.trainee.coach',
      async (payload) => {
        return this.authService.getCoachByTrainee(payload.traineeId);
      }
    );

    this.router.register<{ coachId: string, traineeEmail: string }, void>(
      'auth.coach.addTrainee',
      async (payload) => {
        return this.authService.addTraineeToCoach(
          payload.coachId, 
          payload.traineeEmail
        );
      }
    );

    this.router.register<{ coachId: string, traineeEmail: string }, void>(
      'auth.coach.removeTrainee',
      async (payload) => {
        return this.authService.removeTraineeFromCoach(
          payload.coachId, 
          payload.traineeEmail
        );
      }
    );

    this.router.register<{ coachId: string, traineeId: string }, { hasRelationship: boolean }>(
      'auth.checkCoachTrainee',
      async (payload) => {
        const hasRelationship = await this.authService.checkCoachTraineeRelationship(
          payload.coachId,
          payload.traineeId
        );
        return { hasRelationship };
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