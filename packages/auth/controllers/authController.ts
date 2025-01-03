import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AuthRequest } from '../../shared/middleware/auth';
import { createResponse } from '../../shared/utils/response.utils';
import { GetCoachResponseDTO, GetTraineesResponseDTO } from '../types';

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
    const trainees: GetTraineesResponseDTO = 
      await this.authService.getTraineesByCoach(req.user._id);
    res.json(
      createResponse('success', 'Trainees retrieved successfully', trainees)
    );
  }

  async getCoachByTrainee(req: AuthRequest, res: Response) {
    const coach: GetCoachResponseDTO = 
      await this.authService.getCoachByTrainee(req.user._id);
    res.json(
      createResponse('success', 'Coach retrieved successfully', coach)
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

  async getOwnProfile(req: AuthRequest, res: Response) {
    const user = await this.authService.getOwnProfile(req.user._id);
    res.json(
      createResponse('success', 'Profile retrieved successfully', user )
    );
  }

  async checkCoachTraineeRelationship(req: AuthRequest, res: Response) {
    const { traineeId } = req.params;
    const coachId = req.user._id;

    const hasRelationship = await this.authService.checkCoachTraineeRelationship(
      coachId,
      traineeId
    );

    res.json(
      createResponse('success', 'Relationship check completed', { hasRelationship })
    );
  }

  async getUsersByIds(req: AuthRequest, res: Response) {
    const userIds = req.query.ids as string[];
    
    if (!Array.isArray(userIds)) {
      res.status(400).json(
        createResponse('fail', 'ids must be an array of strings')
      );
      return;
    }

    const users = await this.authService.getUsersByIds(userIds);
    res.json(
      createResponse('success', 'Users retrieved successfully', { users })
    );
  }
} 