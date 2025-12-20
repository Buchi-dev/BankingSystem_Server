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

const app = require("./app");
const connectDB = require("./configs/mongo.config");
const Bank = require("./models/bank.model");

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

connectDB()
  .then(async () => {
    // Initialize bank on startup
    await initializeBank();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
