export enum UserRole {
  COACH = 'coach',
  TRAINEE = 'trainee'
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO extends LoginDTO {
  name: string;
  role: UserRole;
} 