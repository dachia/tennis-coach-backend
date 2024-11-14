import { UserRole } from "../../shared/constants/UserRole";

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO extends LoginDTO {
  name: string;
  role: UserRole;
}

export interface UserResponseDTO {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface GetTraineesResponseDTO {
  trainees: UserResponseDTO[];
}

export interface GetCoachResponseDTO {
  coach: UserResponseDTO;
}

export interface GetProfileResponseDTO {
  user: UserResponseDTO;
} 