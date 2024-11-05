import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT!),
  jwtSecret: process.env.JWT_SECRET!,
  mongoUri: process.env.MONGO_URI!,
};
export const testConfig = {
  jwtSecret: 'test-secret',
  port: 0,
  mongoUri: 'mongodb://localhost:27017/test',
};

