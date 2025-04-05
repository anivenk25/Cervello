import mongoose from 'mongoose';

// Don't hardcode credentials in your code
const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('Connected to MongoDB successfully!');
        return mongoose;
      })
      .catch((error) => {
        console.error('Error connecting to MongoDB:', error.message);
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// For NextAuth MongoDB adapter
let clientPromise;

const getMongoClient = async () => {
  try {
    await dbConnect();
    // @ts-ignore
    clientPromise = mongoose.connection.getClient();
    return clientPromise;
  } catch (error) {
    console.error('Failed to get MongoDB client:', error);
    throw error;
  }
};

// Initialize the client promise
getMongoClient();

export default dbConnect;
export { clientPromise };