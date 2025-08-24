const mongoose = require("mongoose");
const { Pool } = require("pg");
const path = require("path");

// Load environment variables from config.env for local development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: path.join(__dirname, "../config.env") });
}

// MongoDB Connection with better timeout handling for Vercel
const connectMongoDB = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: 15000, // 15 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 15000, // 15 seconds
      maxPoolSize: 1, // Limit connections for serverless
      minPoolSize: 0, // Allow 0 connections when idle
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      bufferCommands: false, // Disable buffering for serverless
      bufferMaxEntries: 0, // Disable buffer for serverless
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    // Don't throw error, let the app continue
  }
};

// Connect to MongoDB
connectMongoDB();

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// PostgreSQL Connection
const pgPool = new Pool({
  connectionString: process.env.POSTGRES_CONN,
  max: 1, // Limit connections for serverless
  idleTimeoutMillis: 30000, // Close connections after 30 seconds
  connectionTimeoutMillis: 15000, // 15 second connection timeout
});

pgPool.on("connect", () => {
  console.log("PostgreSQL connected successfully");
});

pgPool.on("error", (err) => {
  console.error("PostgreSQL connection error:", err);
});

module.exports = { pgPool };
