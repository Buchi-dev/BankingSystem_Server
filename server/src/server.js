/**
 * SERVER.JS
 * =========
 * Entry point of the backend application.
 * - Connects to MongoDB
 * - Initializes bank balance (singleton)
 * - Starts the Express server
 */

// Load environment variables
require('dotenv').config();

// Validate critical environment variables on startup
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("❌ JWT_SECRET must be at least 32 characters");
  process.exit(1);
}

const app = require("./app");
const connectDB = require("./configs/mongo.config");
const Bank = require("./models/bank.model");
const seedDefaultUsers = require("./utils/seedUsers");

const PORT = process.env.PORT || 5000;

/**
 * Initialize the bank balance on startup
 * Ensures the singleton bank document exists with initial balance
 */
const initializeBank = async () => {
  try {
    const bank = await Bank.getOrCreateBank();
    const balance = parseFloat(bank.bankBalance.toString());
    console.log(`✅ Bank initialized - Balance: PHP ${balance.toLocaleString()}`);
    return bank;
  } catch (error) {
    console.error("❌ Failed to initialize bank:", error.message);
    throw error;
  }
};

let server;

connectDB()
  .then(async () => {
    // Initialize bank on startup
    await initializeBank();

    // Seed default staff and admin users
    await seedDefaultUsers();

    server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Stop accepting new requests
  if (server) {
    server.close(() => {
      console.log("HTTP server closed");
    });
  }

  // Close database connection
  try {
    const mongoose = require("mongoose");
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
