import * as yup from 'yup';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { LoginDTO, RegisterDTO, UserRole } from '../types';
import { CoachTrainee } from '../models/CoachTrainee';
import { EventService } from '../../shared';
import { AuthRequest } from '../../shared/middleware/auth';
import { createResponse } from '../../shared/utils/response.utils';

// Add validation schemas
const registerSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(6).required(),
  name: yup.string().required(),
  role: yup.string().oneOf(Object.values(UserRole)).required()
});

const loginSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().required()
});

export class AuthController {
  private readonly config: { jwtSecret: string };
  constructor(private readonly userModel: typeof User, private readonly coachTraineeModel: typeof CoachTrainee, private readonly eventService: EventService, config: { jwtSecret: string }) {
    this.userModel = userModel;
    this.coachTraineeModel = coachTraineeModel;
    this.eventService = eventService;
    this.config = config;
  }

  async register(req: Request<{}, {}, RegisterDTO>, res: Response) {
    // Add validation
    try {
      await registerSchema.validate(req.body);
    } catch (err: any) {
      return res.status(400).json(
        createResponse('fail', err.message)
      );
    }

    const { email, password, name, role } = req.body;

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json(
        createResponse('fail', 'Email already registered')
      );
    }

    const user = new this.userModel({ email, password, name, role });
    await user.save();

    const token = jwt.sign(
      { sub: user._id, role: user.role },
      this.config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json(
      createResponse('success', 'User registered successfully', { token })
    );
  }

  async login(req: Request<{}, {}, LoginDTO>, res: Response) {
    // Add validation
    try {
      await loginSchema.validate(req.body);
    } catch (err: any) {
      return res.status(400).json(
        createResponse('fail', err.message)
      );
    }

    const { email, password } = req.body;

    const user = await this.userModel.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json(
        createResponse('fail', 'Invalid credentials')
      );
    }

    const token = jwt.sign(
      { sub: user._id, role: user.role },
      this.config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json(
      createResponse('success', 'Login successful', { token })
    );
  }

  async getTraineesByCoach(req: AuthRequest, res: Response) {
    const coachId = req.user._id;

    const coachTrainees = await this.coachTraineeModel
      .find({ coachId })
      .populate('traineeId', 'name email');

    const trainees = coachTrainees.map(ct => ct.traineeId);
    res.json(
      createResponse('success', 'Trainees retrieved successfully', { trainees })
    );
  }

  async getCoachByTrainee(req: AuthRequest, res: Response) {
    const traineeId = req.user._id;

    const coachTrainee = await this.coachTraineeModel
      .findOne({ traineeId })
      .populate('coachId', 'name email');

    if (!coachTrainee) {
      return res.status(404).json(
        createResponse('fail', 'No coach found for this trainee')
      );
    }

    res.json(
      createResponse('success', 'Coach retrieved successfully', { coach: coachTrainee.coachId })
    );
  }
} 