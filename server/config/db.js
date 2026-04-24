const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error(' MONGODB_URI environment variable is not defined');
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGODB_URI is required in production');
      }
      return;
    }
    
    if (cached.conn) {
      console.log(' Using existing MongoDB connection');
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: true,
      };

      cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongoose) => {
        return mongoose;
      });
    }

    cached.conn = await cached.promise;
    console.log(` MongoDB Connected: ${cached.conn.connection.host}`);
    return cached.conn;
  } catch (error) {
    console.error(` MongoDB Connection Error: ${error.message}`);
    cached.promise = null;
    // Don't exit in production/Vercel to allow for better error handling
    if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;
