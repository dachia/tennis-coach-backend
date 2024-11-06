import request from 'supertest';
import { Express } from 'express';
import { setupTestDatabase } from '../../shared/tests';
import { UserRole } from '../../auth/types';
import mongoose from 'mongoose';
import { bootstrapServer } from '../server';
import { testConfig } from '../config';
import { createTestContainer } from '../di';

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

    const { app: testApp, server: testServer, closeServer: closeServerFn } = await bootstrapServer({
      ...testConfig,
      mongoUri: uri,
    }, createTestContainer(testConfig));
    app = testApp;
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
      expect(response.body).toMatchObject({
        status: 'success',
        data: {
          message: expect.any(String),
          payload: {
            token: expect.any(String)
          }
        },
        error: null,
        version: expect.any(Number)
      });
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
      expect(response.body).toMatchObject({
        status: 'fail',
        data: null,
        error: {
          message: 'Email already registered'
        },
        version: expect.any(Number)
      });
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
      expect(response.body).toMatchObject({
        status: 'fail',
        data: null,
        error: {
          message: expect.any(String)
        },
        version: expect.any(Number)
      });
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
      expect(response.body).toMatchObject({
        status: 'success',
        data: {
          message: expect.any(String),
          payload: {
            token: expect.any(String)
          }
        },
        error: null,
        version: expect.any(Number)
      });
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
      expect(response.body).toMatchObject({
        status: 'fail',
        data: null,
        error: {
          message: 'Invalid credentials'
        },
        version: expect.any(Number)
      });
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
      expect(response.body).toMatchObject({
        status: 'fail',
        data: null,
        error: {
          message: 'Invalid credentials'
        },
        version: expect.any(Number)
      });
    });
  });

  describe('GET /auth/profile', () => {
    let authToken: string;

    beforeEach(async () => {
      // Create a test user and get token
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: UserRole.COACH
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      authToken = response.body.data.payload.token;
    });

    it('should return user profile when authenticated', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'success',
        data: {
          message: expect.any(String),
          payload: {
            user: {
              _id: expect.any(String),
              name: 'Test User',
              email: 'test@example.com',
              role: UserRole.COACH
            }
          }
        },
        error: null,
        version: expect.any(Number)
      });
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/auth/profile');

      expect(response.status).toBe(401);
    });
  });
});
