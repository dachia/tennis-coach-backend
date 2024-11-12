import { TransportRouter } from '../../shared/transport/transportRouter';
import { Transport } from '../../shared/transport/transport';
import { AuthService } from '../services/authService';
import { AuthTransport } from '../../shared/transport/types/auth';
import { TransportRoutes } from '../../shared/transport/constants';
import { createResponse } from '../../shared/utils';

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
    this.router.register<AuthTransport.RegisterRequest, AuthTransport.RegisterResponse>(
      TransportRoutes.Auth.REGISTER,
      async (payload) => {
        const response = await this.authService.register(payload);
        return createResponse('success', 'User registered successfully', response);
      }
    );

    this.router.register<AuthTransport.LoginRequest, AuthTransport.LoginResponse>(
      TransportRoutes.Auth.LOGIN,
      async (payload) => {
        const response = await this.authService.login(payload);
        return createResponse('success', 'User logged in successfully', response);
      }
    );

    this.router.register<AuthTransport.GetTraineesByCoachRequest, AuthTransport.GetTraineesByCoachResponse>(
      TransportRoutes.Auth.GET_TRAINEES_BY_COACH,
      async (payload) => {
        const response = await this.authService.getTraineesByCoach(payload.coachId);
        return createResponse('success', 'Trainees fetched successfully', response);
      }
    );

    this.router.register<AuthTransport.GetCoachByTraineeRequest, AuthTransport.GetCoachByTraineeResponse>(
      TransportRoutes.Auth.GET_COACH_BY_TRAINEE,
      async (payload) => {
        const response = await this.authService.getCoachByTrainee(payload.traineeId);
        return createResponse('success', 'Coach fetched successfully', response);
      }
    );

    this.router.register<AuthTransport.AddTraineeRequest, AuthTransport.AddTraineeResponse>(
      TransportRoutes.Auth.ADD_TRAINEE,
      async (payload) => {
        await this.authService.addTraineeToCoach(payload.coachId, payload.traineeEmail);
        return createResponse('success', 'Trainee added to coach successfully');
      }
    );

    this.router.register<AuthTransport.RemoveTraineeRequest, AuthTransport.RemoveTraineeResponse>(
      TransportRoutes.Auth.REMOVE_TRAINEE,
      async (payload) => {
        await this.authService.removeTraineeFromCoach(payload.coachId, payload.traineeEmail);
        return createResponse('success', 'Trainee removed from coach successfully');
      }
    );

    this.router.register<AuthTransport.CheckCoachTraineeRequest, AuthTransport.CheckCoachTraineeResponse>(
      TransportRoutes.Auth.CHECK_COACH_TRAINEE,
      async (payload) => {
        const hasRelationship = await this.authService.checkCoachTraineeRelationship(
          payload.coachId,
          payload.traineeId
        );
        return createResponse('success', 'Coach trainee relationship checked successfully', { hasRelationship });
      }
    );

    this.router.register<AuthTransport.GetUsersByIdsRequest, AuthTransport.GetUsersByIdsResponse>(
      TransportRoutes.Auth.GET_USERS,
      async (payload) => {
        const response = await this.authService.getUsersByIds(payload.ids);
        return createResponse('success', 'Users fetched successfully', response);
      }
    );
  }

  async listen() {
    await this.router.listen();
  }

  async close() {
    await this.router.close();
  }
} 