import mongoose from 'mongoose';

let isConnected = false;

export const connectToDatabase = async (uri: string) => {
  if (isConnected) {
    console.info('Using existing database connection');
    return;
  }

  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.info('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

export const closeDatabaseConnection = async () => {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    console.info('Closed database connection');
  }
};
