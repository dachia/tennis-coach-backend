import { User } from '../models/User';
import { CoachTrainee } from '../models/CoachTrainee';
import { GetCoachResponseDTO, GetProfileResponseDTO, GetTraineesResponseDTO, LoginDTO, RegisterDTO, UserResponseDTO } from '../types';
import { EventService } from '../../shared/';
import jwt from 'jsonwebtoken';
import { loginSchema, registerSchema } from '../validation';
import { DomainError } from '../../shared/errors/DomainError';
import { mapUser } from '../mappers/responseMappers';

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

  async getTraineesByCoach(coachId: string): Promise<GetTraineesResponseDTO> {
    const coachTrainees = await this.coachTraineeModel
      .find({ coachId })
      .populate('trainee', 'name email _id role')

    return {
      trainees: coachTrainees.map((ct: any) => mapUser(ct.trainee))
    };
  }

  async getCoachByTrainee(traineeId: string): Promise<GetCoachResponseDTO> {
    const coachTrainee = await this.coachTraineeModel
      .findOne({ traineeId })
      .populate('coach', 'name email _id role')

    if (!coachTrainee) {
      throw new DomainError('No coach found for this trainee', 404);
    }

    return {
      coach: mapUser(coachTrainee.coach)
    };
  }

  async addTraineeToCoach(coachId: string, traineeEmail: string): Promise<void> {
    // Verify coach exists and has correct role
    const coach = await this.userModel.findById(coachId);
    if (!coach || coach.role !== 'coach') {
      throw new DomainError('Invalid coach ID', 404);
    }

    // Find trainee by email
    const trainee = await this.userModel.findOne({ email: traineeEmail });
    if (!trainee || trainee.role !== 'trainee') {
      throw new DomainError('Invalid trainee email', 404);
    }

    // Check if trainee already has a coach
    const existingRelation = await this.coachTraineeModel.findOne({ traineeId: trainee._id });
    if (existingRelation) {
      throw new DomainError('Trainee already has a coach', 400);
    }

    // Create the relationship
    await this.coachTraineeModel.create({ 
      coachId, 
      traineeId: trainee._id 
    });

    await this.eventService.publishDomainEvent({
      eventName: 'auth.trainee.assigned',
      payload: {
        coachId,
        traineeId: trainee._id,
        traineeEmail
      }
    });
  }

  async removeTraineeFromCoach(coachId: string, traineeEmail: string): Promise<void> {
    // Find trainee by email
    const trainee = await this.userModel.findOne({ email: traineeEmail });
    if (!trainee) {
      throw new DomainError('Trainee not found', 404);
    }

    const relation = await this.coachTraineeModel.findOne({ 
      coachId, 
      traineeId: trainee._id 
    });
    
    if (!relation) {
      throw new DomainError('Coach-trainee relationship not found', 404);
    }

    await this.coachTraineeModel.deleteOne({ 
      coachId, 
      traineeId: trainee._id 
    });

    await this.eventService.publishDomainEvent({
      eventName: 'auth.trainee.unassigned',
      payload: {
        coachId,
        traineeId: trainee._id,
        traineeEmail
      }
    });
  }

  async getOwnProfile(userId: string): Promise<GetProfileResponseDTO> {
    const user = await this.userModel.findById(userId).select('name email _id role') as UserResponseDTO;
    if (!user) {
      throw new DomainError('User not found', 404);
    }

    return {
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }

  private generateToken(user: any): string {
    return jwt.sign(
      { sub: user._id, role: user.role },
      this.config.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  async checkCoachTraineeRelationship(coachId: string, traineeId: string): Promise<boolean> {
    const relationship = await this.coachTraineeModel.findOne({
      coachId,
      traineeId
    });
    
    return !!relationship;
  }

  async getUsersByIds(userIds: string[]): Promise<{ users: UserResponseDTO[] }> {
    const users = await this.userModel
      .find({ _id: { $in: userIds } })
      .select('name email _id role');

    return {
      users: users.map(user => mapUser(user))
    };
  }
} 