const mongoose = require("mongoose");
const { Pool } = require("pg");
const path = require("path");

// Load environment variables from config.env for local development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: path.join(__dirname, "../config.env") });
}

// MongoDB Connection with retry logic for Vercel
const connectMongoDB = async (retries = 3) => {
  try {
    console.log("Attempting to connect to MongoDB...");
    
    const options = {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 30000, // 30 seconds
      maxPoolSize: 1, // Limit connections for serverless
      minPoolSize: 0, // Allow 0 connections when idle
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      bufferCommands: false, // Disable buffering for serverless
      bufferMaxEntries: 0, // Disable buffer for serverless
      // Vercel-specific options
      family: 4, // Force IPv4
      retryWrites: true,
      w: "majority",
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log("MongoDB connected successfully");
    return true;
  } catch (error) {
    console.error(`MongoDB connection attempt ${4 - retries} failed:`, error.message);
    
    if (retries > 1) {
      console.log(`Retrying in 2 seconds... (${retries - 1} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return connectMongoDB(retries - 1);
    } else {
      console.error("MongoDB connection failed after all retries");
      return false;
    }
  }
};

// Connect to MongoDB with retry
let mongoConnected = false;
connectMongoDB().then(success => {
  mongoConnected = success;
});

// Handle MongoDB connection events
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
  mongoConnected = false;
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
  mongoConnected = false;
});

mongoose.connection.on("connected", () => {
  console.log("MongoDB connected");
  mongoConnected = true;
});

// Export connection status for other modules
module.exports.mongoConnected = () => mongoConnected;

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
