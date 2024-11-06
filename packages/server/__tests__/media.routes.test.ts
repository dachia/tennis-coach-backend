import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { Container, setupTestDatabase } from '../../shared';
import { bootstrapApp } from '../app';
import { User } from '../../auth/models/User';
import { UserRole } from '../../auth/types';
import { testConfig } from '../config';
import { createTestContainer } from '../di';
import { bootstrapServer } from '../server';

const s3Mock = mockClient(S3Client);

describe('Media Routes', () => {
  let user: any;
  let userToken: string;
  let app: Express;
  let server: any;
  let closeDatabase: () => Promise<void>;
  let closeServer: () => Promise<void>;
  let coach: any;
  let trainee: any;
  let coachToken: string;
  let traineeToken: string;

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

  beforeEach(async () => {
    // Clear all mocks
    s3Mock.reset();

    // Create test user
    user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: UserRole.TRAINEE
    });

    // Get auth token
    const authResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    userToken = authResponse.body.data.payload.token;
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await closeServer();
    await closeDatabase();
  });

  describe('POST /media/presigned-url', () => {
    it('should generate presigned URL for valid file type', async () => {
      const response = await request(app)
        .post('/media/presigned-url')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          fileType: 'image/jpeg'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'success',
        data: {
          message: 'Presigned URL generated successfully',
          payload: {
            uploadUrl: expect.any(String),
            fileUrl: expect.stringMatching(/^https:\/\/tennis-coach-test-bucket\.s3\.eu-central-1\.amazonaws\.com\/uploads\/.*\.jpeg$/)
          }
        },
        error: null,
        version: expect.any(Number)
      });
    });

    it('should reject invalid file types', async () => {
      const response = await request(app)
        .post('/media/presigned-url')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          fileType: 'application/pdf'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('Unsupported file type');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/media/presigned-url')
        .send({
          fileType: 'image/jpeg'
        });

      expect(response.status).toBe(401);
    });

    it('should handle missing file type', async () => {
      const response = await request(app)
        .post('/media/presigned-url')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('File type is required');
    });
  });

  describe.skip('DELETE /media', () => {
    it('should delete media file successfully', async () => {
      // Mock successful S3 delete
      s3Mock.on(DeleteObjectCommand).resolves({});

      const fileUrl = `https://test-bucket.s3.us-east-1.amazonaws.com/uploads/${user._id}/test-image.jpg`;

      const response = await request(app)
        .delete('/media')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          fileUrl
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'success',
        data: {
          message: 'Media deleted successfully'
        },
        error: null,
        version: expect.any(Number)
      });
    });

    it('should prevent deletion of files from other users', async () => {
      const fileUrl = `https://test-bucket.s3.us-east-1.amazonaws.com/uploads/different-user-id/test-image.jpg`;

      const response = await request(app)
        .delete('/media')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          fileUrl
        });

      expect(response.status).toBe(403);
      expect(response.body.error.message).toBe('Unauthorized to delete this media');
    });

    it('should handle S3 deletion errors', async () => {
      // Mock S3 delete error
      s3Mock.on(DeleteObjectCommand).rejects(new Error('S3 Error'));

      const fileUrl = `https://test-bucket.s3.us-east-1.amazonaws.com/uploads/${user._id}/test-image.jpg`;

      const response = await request(app)
        .delete('/media')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          fileUrl
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('Failed to delete media');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/media')
        .send({
          fileUrl: 'https://test-bucket.s3.amazonaws.com/test-image.jpg'
        });

      expect(response.status).toBe(401);
    });

    it('should handle missing file URL', async () => {
      const response = await request(app)
        .delete('/media')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('File URL is required');
    });

    it('should handle invalid file URL format', async () => {
      const response = await request(app)
        .delete('/media')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          fileUrl: 'invalid-url'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('Invalid file URL');
    });
  });
}); 