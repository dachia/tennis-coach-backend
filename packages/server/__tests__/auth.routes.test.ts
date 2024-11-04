import request from 'supertest';
import { Express } from 'express';
import { bootstrapApp, Container, EventService, InMemoryEventService, InMemoryEventStorage } from '../../shared';
import { addToContainer } from '../../auth/di';
import { setupTestDatabase, setupTestServer } from '../../shared/tests';
import { buildRoutes } from '../../auth/routes';
import { UserRole } from '../../auth/types';
import mongoose from 'mongoose';

describe('Auth Routes', () => {
  let app: Express;
  let server: any;
  let closeDatabase: () => Promise<void>;
  let closeServer: () => Promise<void>;

  beforeAll(async () => {
    // Setup test database
    const { uri, closeDatabase: closeDatabaseFn } = await setupTestDatabase();
    closeDatabase = closeDatabaseFn;

    // Connect to test database
    await mongoose.connect(uri);

    // Setup application with DI container
    app = bootstrapApp();
    const container = new Container();
    const config = { jwtSecret: 'test-secret' };
    container.register('Config', config);
    const eventStorage = new InMemoryEventStorage();
    const eventService = new InMemoryEventService(eventStorage);
    container.register('EventService', eventService);
    addToContainer(container);

    // Add routes
    app.use('/auth', buildRoutes(container));

    // Start test server
    const { server: testServer, closeServer: closeServerFn } = await setupTestServer(app);
    server = testServer;
    closeServer = closeServerFn;
  });

  afterAll(async () => {
    await closeServer();
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clear database collections before each test
    await mongoose.connection.dropDatabase();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: UserRole.COACH
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
    });

    it('should return 400 for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: UserRole.COACH
      };

      // Register first user
      await request(app)
        .post('/auth/register')
        .send(userData);

      // Try to register with same email
      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Email already registered');
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // too short
        name: '',
        role: 'invalid-role'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: UserRole.COACH
      };

      await request(app)
        .post('/auth/register')
        .send(userData);
    });

    it('should login successfully with correct credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should return 401 for incorrect password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 401 for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });
  });
});
