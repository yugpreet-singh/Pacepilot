const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const mongoose = require("mongoose");
const { mongoConnected, waitForConnection } = require("../config/database");
const router = express.Router();

// Debug middleware to log environment variables
router.use((req, res, next) => {
  console.log("Auth route - Environment check:");
  console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
  console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("MongoDB ready state:", mongoose.connection.readyState);
  console.log("MongoDB connected status:", mongoConnected());
  next();
});

// Helper function to check MongoDB connection
const checkMongoConnection = async (req, res, next) => {
  try {
    const isConnected = await waitForConnection();
    if (!isConnected) {
      console.log("MongoDB not connected, returning 503...");
      return res.status(503).json({
        message: "Database connection not ready. Please try again in a moment.",
      });
    }
    console.log("MongoDB connection confirmed, proceeding...");
    next();
  } catch (error) {
    console.error("Error checking MongoDB connection:", error);
    return res.status(503).json({
      message: "Database connection error. Please try again.",
    });
  }
};

// Login user
router.post(
  "/login",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  checkMongoConnection,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      // Find user by username
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Health check endpoint
router.get("/health", async (req, res) => {
  try {
    const mongoStatus = mongoConnected();
    const mongoReadyState = mongoose.connection.readyState;

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      mongoDB: {
        connected: mongoStatus,
        readyState: mongoReadyState,
        readyStateText: getReadyStateText(mongoReadyState),
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasMongoUri: !!process.env.MONGODB_URI,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Helper function to get readable ready state
function getReadyStateText(state) {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[state] || "unknown";
}

module.exports = router;
