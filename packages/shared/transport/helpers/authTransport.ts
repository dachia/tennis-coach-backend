import { TransportRoutes } from '../constants';
import { Transport } from '../transport';
import { AuthTransport } from '../types/auth';
import { createTypedRequest } from './typeRequest';

export class AuthTransportClient {
  constructor(private transport: Transport) {}

  async register(payload: AuthTransport.RegisterRequest) {
    return createTypedRequest<
      AuthTransport.RegisterRequest,
      AuthTransport.RegisterResponse
    >(this.transport, TransportRoutes.Auth.REGISTER, payload);
  }

  async login(payload: AuthTransport.LoginRequest) {
    return createTypedRequest<
      AuthTransport.LoginRequest,
      AuthTransport.LoginResponse
    >(this.transport, TransportRoutes.Auth.LOGIN, payload);
  }

  async getTraineesByCoach(payload: AuthTransport.GetTraineesByCoachRequest) {
    return createTypedRequest<
      AuthTransport.GetTraineesByCoachRequest,
      AuthTransport.GetTraineesByCoachResponse
    >(this.transport, TransportRoutes.Auth.GET_TRAINEES_BY_COACH, payload);
  }

  async getCoachByTrainee(payload: AuthTransport.GetCoachByTraineeRequest) {
    return createTypedRequest<
      AuthTransport.GetCoachByTraineeRequest,
      AuthTransport.GetCoachByTraineeResponse
    >(this.transport, TransportRoutes.Auth.GET_COACH_BY_TRAINEE, payload);
  }

  async addTrainee(payload: AuthTransport.AddTraineeRequest) {
    return createTypedRequest<
      AuthTransport.AddTraineeRequest,
      AuthTransport.AddTraineeResponse
    >(this.transport, TransportRoutes.Auth.ADD_TRAINEE, payload);
  }

  async removeTrainee(payload: AuthTransport.RemoveTraineeRequest) {
    return createTypedRequest<
      AuthTransport.RemoveTraineeRequest,
      AuthTransport.RemoveTraineeResponse
    >(this.transport, TransportRoutes.Auth.REMOVE_TRAINEE, payload);
  }

  async checkCoachTrainee(payload: AuthTransport.CheckCoachTraineeRequest) {
    return createTypedRequest<
      AuthTransport.CheckCoachTraineeRequest,
      AuthTransport.CheckCoachTraineeResponse
    >(this.transport, TransportRoutes.Auth.CHECK_COACH_TRAINEE, payload);
  }

  async getUsersByIds(payload: AuthTransport.GetUsersByIdsRequest) {
    return createTypedRequest<
      AuthTransport.GetUsersByIdsRequest,
      AuthTransport.GetUsersByIdsResponse
    >(this.transport, TransportRoutes.Auth.GET_USERS, payload);
  }
} 