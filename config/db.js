const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = {
        conn: null,
        promise: null
    };
}

async function connectDB() {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Event_Manager';

    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined');
    }

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            maxPoolSize: 10
        });
    }

    try {
        cached.conn = await cached.promise;
        console.log('MongoDB connected successfully');
        return cached.conn;
    } catch (error) {
        cached.promise = null;
        console.error('MongoDB connection failed:', error.message);
        throw error;
    }
}

module.exports = connectDB;
