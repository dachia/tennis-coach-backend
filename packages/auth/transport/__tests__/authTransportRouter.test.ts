import { InMemoryTransport } from '../../../shared/transport/inMemoryTransport';
import { AuthTransportRouter } from '../authTransportRouter';
import { AuthService } from '../../services/authService';
import { UserRole } from "../../../shared/constants/UserRole";
import { DomainError } from '../../../shared/errors/DomainError';
import { createResponse } from '../../../shared';

// Mock AuthService
const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  getTraineesByCoach: jest.fn(),
  getCoachByTrainee: jest.fn()
} as unknown as AuthService;

describe('AuthTransportRouter', () => {
  let transport: InMemoryTransport;
  let authTransportRouter: AuthTransportRouter;

  beforeEach(async () => {
    transport = new InMemoryTransport();
    await transport.connect();
    authTransportRouter = new AuthTransportRouter(transport, mockAuthService);
    await authTransportRouter.listen();
  });

  afterEach(async () => {
    await authTransportRouter.close();
    await transport.disconnect();
    jest.clearAllMocks();
  });

  it('should handle registration requests', async () => {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: UserRole.COACH
    };

    const expectedResponse = { token: 'test-token' };
    jest.spyOn(mockAuthService, 'register').mockResolvedValue(expectedResponse);

    const response = await transport.request(
      'auth.register',
      {
        type: 'REGISTER',
        payload: registerData
      }
    );

    expect(response).toEqual(createResponse('success', 'User registered successfully', expectedResponse));
    expect(mockAuthService.register).toHaveBeenCalledWith(registerData);
  });

  it('should handle login requests', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const expectedResponse = { token: 'test-token' };
    jest.spyOn(mockAuthService, 'login').mockResolvedValue(expectedResponse);

    const response = await transport.request(
      'auth.login',
      {
        type: 'LOGIN',
        payload: loginData
      }
    );

    expect(response).toEqual(createResponse('success', 'User logged in successfully', expectedResponse));
    expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
  });

  it('should handle errors properly', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'wrong-password'
    };

    jest.spyOn(mockAuthService, 'login').mockRejectedValue(
      new DomainError('Invalid credentials', 401)
    );

    const error: any = await transport.request(
      'auth.login',
      {
        type: 'LOGIN',
        payload: loginData
      }
    );

    expect(error.message).toBe('Invalid credentials');
    expect(error.code).toBe('INTERNAL_ERROR');
  });
}); 