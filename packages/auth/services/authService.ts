import { User } from '../models/User';
import { CoachTrainee } from '../models/CoachTrainee';
import { LoginDTO, RegisterDTO } from '../types';
import { EventService } from '../../shared/';
import jwt from 'jsonwebtoken';
import { loginSchema, registerSchema } from '../validation';
import { DomainError } from '../../shared/errors/DomainError';

export class AuthService {
  constructor(
    private readonly userModel: typeof User,
    private readonly coachTraineeModel: typeof CoachTrainee,
    private readonly eventService: EventService,
    private readonly config: { jwtSecret: string }
  ) {}

  async register(data: RegisterDTO): Promise<{ token: string }> {
    try {
      await registerSchema.validate(data);
    } catch (err: any) {
      throw new DomainError(err.message);
    }

    const { email, password, name, role } = data;

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new DomainError('Email already registered');
    }

    const user = new this.userModel({ email, password, name, role });
    await user.save();

    const token = this.generateToken(user);

    await this.eventService.publishDomainEvent({
      eventName: 'auth.user.registered',
      payload: {
        userId: user._id,
        role: user.role
      }
    });

    return { token };
  }

  async login(data: LoginDTO): Promise<{ token: string }> {
    try {
      await loginSchema.validate(data);
    } catch (err: any) {
      throw new DomainError(err.message);
    }

    const { email, password } = data;

    const user = await this.userModel.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      throw new DomainError('Invalid credentials', 401);
    }

    const token = this.generateToken(user);

    await this.eventService.publishDomainEvent({
      eventName: 'auth.user.logged_in',
      payload: {
        userId: user._id,
        role: user.role
      }
    });

    return { token };
  }

  async getTraineesByCoach(coachId: string) {
    const coachTrainees = await this.coachTraineeModel
      .find({ coachId })
      .populate('traineeId', 'name email');

    return coachTrainees.map(ct => ct.traineeId);
  }

  async getCoachByTrainee(traineeId: string) {
    const coachTrainee = await this.coachTraineeModel
      .findOne({ traineeId })
      .populate('coachId', 'name email');

    if (!coachTrainee) {
      throw new DomainError('No coach found for this trainee', 404);
    }

    return coachTrainee.coachId;
  }

  private generateToken(user: any): string {
    return jwt.sign(
      { sub: user._id, role: user.role },
      this.config.jwtSecret,
      { expiresIn: '7d' }
    );
  }
} 