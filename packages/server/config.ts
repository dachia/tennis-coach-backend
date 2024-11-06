import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT!),
  jwtSecret: process.env.JWT_SECRET!,
  mongoUri: process.env.MONGO_URI!,
  aws: {
    s3: {
      bucketName: process.env.AWS_S3_BUCKET_NAME!,
      region: process.env.AWS_S3_REGION!,
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
      maxFileSize: parseInt(process.env.AWS_S3_MAX_FILE_SIZE!)
    }
  }
};
export const testConfig = {
  jwtSecret: 'test-secret',
  port: 0,
  mongoUri: 'mongodb://localhost:27017/test',
  aws: {
    s3: {
      bucketName: 'tennis-coach-test-bucket',
      region: 'eu-central-1',
      accessKeyId: 'AKIA3UV2BUSHCRRFLC4X',
      secretAccessKey: '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',
      maxFileSize: 1000000
    }
  }
};

