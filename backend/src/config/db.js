const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

    if (!mongoUri) {
      throw new Error('MongoDB connection string is missing. Check MONGO_URI environment variable in .env');
    }

    const trimmedUri = mongoUri.trim();

    if (!trimmedUri.startsWith('mongodb://') && !trimmedUri.startsWith('mongodb+srv://')) {
      throw new Error('Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://". Check MONGO_URI environment variable in .env');
    }

    const conn = await mongoose.connect(trimmedUri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Failed to connect: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
