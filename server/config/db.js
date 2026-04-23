const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error(' MONGODB_URI environment variable is not defined');
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGODB_URI is required in production');
      }
      return;
    }
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Modern mongoose doesn't need these options but good to be explicit
    });
    console.log(` MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(` MongoDB Connection Error: ${error.message}`);
    // Don't exit in production/Vercel to allow for better error handling
    if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;
