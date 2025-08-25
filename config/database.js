const mongoose = require("mongoose");
const { Pool } = require("pg");
const path = require("path");

// Always load environment variables from config.env file
require("dotenv").config({ path: path.join(__dirname, "../config.env") });

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on("connected", () => {
  console.log("MongoDB connected successfully");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

// PostgreSQL Connection
const pgPool = new Pool({
  connectionString: process.env.POSTGRES_CONN,
  ssl: { rejectUnauthorized: false },
});

pgPool.on("connect", () => {
  console.log("PostgreSQL connected successfully");
});

pgPool.on("error", (err) => {
  console.error("PostgreSQL connection error:", err);
});

module.exports = {
  pgPool,
  mongoConnected: () => mongoose.connection.readyState === 1,
};
