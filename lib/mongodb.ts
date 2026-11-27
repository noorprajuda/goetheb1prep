import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MongoDB URI is missing! Please define it in your .env file.');
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

// Extend globalThis to include mongoose cache
declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

let cached = globalThis.mongoose;

if (!cached) {
  cached = globalThis.mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
  if (!cached) {
    throw new Error('MongoDB cache not initialized');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable buffering for faster error reporting
    };

    // Correctly use mongoose to connect
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      if (cached) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cached.conn = mongooseInstance as any;
      }
      return cached;
    }).catch((err) => {
      console.error('MongoDB connection error:', err);
      throw new Error('Failed to connect to MongoDB');
    });
  }

  await cached.promise;
  return cached.conn;
}


export default dbConnect;