const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
require("dotenv").config({ path: "../config.env" });

// User Schema (same as in models/User.js)
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);

// Function to create a user
async function createUser(username, email, password) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      console.log("User already exists!");
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();
    console.log("User created successfully!");
    console.log("Username:", username);
    console.log("Email:", email);
    console.log("Password: [HASHED]");

  } catch (error) {
    console.error("Error creating user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Example usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length !== 3) {
    console.log("Usage: node create-user.js <username> <email> <password>");
    console.log("Example: node create-user.js admin admin@example.com mypassword123");
    process.exit(1);
  }

  const [username, email, password] = args;
  createUser(username, email, password);
}

module.exports = { createUser };
