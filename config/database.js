const mongoose = require("mongoose");
const { Pool } = require("pg");

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// PostgreSQL Connection
const pgPool = new Pool({
  connectionString: process.env.POSTGRES_CONN,
});

pgPool.on("connect", () => {
  console.log("PostgreSQL connected successfully");
});

pgPool.on("error", (err) => {
  console.error("PostgreSQL connection error:", err);
});

module.exports = { pgPool };
