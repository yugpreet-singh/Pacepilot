const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const mongoose = require("mongoose");
const { mongoConnected } = require("../config/database");
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
const checkMongoConnection = (req, res, next) => {
  if (!mongoConnected() && mongoose.connection.readyState !== 1) {
    console.log("MongoDB not connected, attempting to reconnect...");
    return res.status(503).json({
      message: "Database connection not ready. Please try again in a moment.",
    });
  }
  next();
};

// Register user
router.post(
  "/register",
  [
    body("username")
      .isLength({ min: 3 })
      .withMessage("Username must be have least 3 characters."),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must have at least 6 characters."),
  ],
  checkMongoConnection,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ username }, { email }],
      });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create new user
      const user = new User({ username, email, password });
      await user.save();

      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      res.status(201).json({
        message: "User created successfully",
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

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
        readyStateText: getReadyStateText(mongoReadyState)
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasMongoUri: !!process.env.MONGODB_URI
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

// Helper function to get readable ready state
function getReadyStateText(state) {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };
  return states[state] || "unknown";
}

module.exports = router;
