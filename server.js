const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Database connections
require("./config/database");

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/targets", require("./routes/targets"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/tags", require("./routes/tags"));

// Serve the main application for all routes
app.get("*", (req, res) => {
  // If it's an API route, let it pass through
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  // For all other routes, serve the main app
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
