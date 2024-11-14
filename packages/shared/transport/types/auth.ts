import { BaseRequest } from './base';
import { UserRole } from "../../constants/UserRole";
import { ResponsePayload } from '../../utils/response.utils';

export namespace AuthTransport {
  export interface RegisterRequest extends BaseRequest {
    email: string;
    password: string;
    name: string;
    role: UserRole;
  }

  export interface RegisterResponse extends ResponsePayload<{
    token: string;
  }> {}

  export interface LoginRequest extends BaseRequest {
    email: string;
    password: string;
  }

  export interface LoginResponse extends ResponsePayload<{
    token: string;
  }> {}

  export interface GetTraineesByCoachRequest extends BaseRequest {
    coachId: string;
  }

  export interface GetTraineesByCoachResponse extends ResponsePayload<{
    trainees: Array<{
      _id: string;
      email: string;
      name: string;
    }>;
  }> {}

  export interface GetCoachByTraineeRequest extends BaseRequest {
    traineeId: string;
  }

  export interface GetCoachByTraineeResponse extends ResponsePayload<{
    coach: {
      _id: string;
      email: string;
      name: string;
    };
  }> {}

  export interface AddTraineeRequest extends BaseRequest {
    coachId: string;
    traineeEmail: string;
  }

  export interface AddTraineeResponse extends ResponsePayload<{
    success: boolean;
  }> {}

  export interface RemoveTraineeRequest extends BaseRequest {
    coachId: string;
    traineeEmail: string;
  }

  export interface RemoveTraineeResponse extends ResponsePayload<{
    success: boolean;
  }> {}

  export interface CheckCoachTraineeRequest extends BaseRequest {
    coachId: string;
    traineeId: string;
  }

  export interface CheckCoachTraineeResponse extends ResponsePayload<{
    hasRelationship: boolean;
  }> {}

  export interface GetUsersByIdsRequest extends BaseRequest {
    ids: string[];
  }

  export interface GetUsersByIdsResponse extends ResponsePayload<{
    users: Array<{
      _id: string;
      email: string;
      name: string;
      role: UserRole;
    }>;
  }> {}
} 