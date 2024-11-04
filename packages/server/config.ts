import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT!),
  jwtSecret: process.env.JWT_SECRET!,
  mongoUri: process.env.MONGO_URI!,
};
