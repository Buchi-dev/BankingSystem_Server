/**
 * SERVER.JS
 * =========
 * Entry point of the backend application.
 * - Connects to MongoDB
 * - Starts the Express server
 */

// Load environment variables
require('dotenv').config();

const app = require("./app");
const connectDB = require("./configs/mongo.config");

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
