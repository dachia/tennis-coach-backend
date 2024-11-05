import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AuthRequest } from '../../shared/middleware/auth';
import { createResponse } from '../../shared/utils/response.utils';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async register(req: Request, res: Response) {
    const { token } = await this.authService.register(req.body);
    res.status(201).json(
      createResponse('success', 'User registered successfully', { token })
    );
  }

  async login(req: Request, res: Response) {
    const { token } = await this.authService.login(req.body);
    res.json(
      createResponse('success', 'Login successful', { token })
    );
  }

  async getTraineesByCoach(req: AuthRequest, res: Response) {
    const trainees = await this.authService.getTraineesByCoach(req.user._id);
    res.json(
      createResponse('success', 'Trainees retrieved successfully', { trainees })
    );
  }

  async getCoachByTrainee(req: AuthRequest, res: Response) {
    const coach = await this.authService.getCoachByTrainee(req.user._id);
    res.json(
      createResponse('success', 'Coach retrieved successfully', { coach })
    );
  }

  async addTraineeToCoach(req: AuthRequest, res: Response) {
    await this.authService.addTraineeToCoach(
      req.user._id, 
      req.body.traineeEmail
    );
    res.json(
      createResponse('success', 'Trainee added successfully')
    );
  }

  async removeTraineeFromCoach(req: AuthRequest, res: Response) {
    await this.authService.removeTraineeFromCoach(
      req.user._id, 
      req.body.traineeEmail
    );
    res.json(
      createResponse('success', 'Trainee removed successfully')
    );
  }
} 