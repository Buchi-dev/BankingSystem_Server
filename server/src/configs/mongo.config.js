/**
 * MONGO.CONFIG.JS - MONGODB DATABASE CONNECTION
 * ==============================================
 * This file handles the connection to MongoDB database using Mongoose.
 * Mongoose is an ODM (Object Data Modeling) library for MongoDB and Node.js
 * 
 * FLOW:
 * 1. Import mongoose library
 * 2. Create async connection function
 * 3. Try to connect using connection string
 * 4. Log success or handle errors
 * 5. Export function for use in server.js
 */

// Import Mongoose - MongoDB object modeling tool
// Provides schema-based solution to model application data
const mongoose = require('mongoose');

/**
 * Connect to MongoDB Database
 * @async
 * @function connectDB
 * @returns {Promise<void>}
 * 
 * CONNECTION STRING FORMAT:
 * mongodb://localhost:27017/mydatabase
 *   - mongodb:// = protocol
 *   - localhost = host (or IP address)
 *   - 27017 = port (default MongoDB port)
 *   - mydatabase = database name
 * 
 * For production, use environment variable:
 * mongodb+srv://username:password@cluster.mongodb.net/dbname
 */
const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB
    // Check multiple possible environment variable names for flexibility
    const mongoUri = process.env.MONGO_URI || 
                     process.env.MONGODB_URI || 
                     process.env.DATABASE_URL || 
                     'mongodb+srv://hedtjyuzon_db_user:3iTnNgJbnjPF27nv@cluster0.qidesdz.mongodb.net/BankingSystemDB?retryWrites=true&w=majority';
    
    const conn = await mongoose.connect(mongoUri);
    
    // Log successful connection with host information
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Log error if connection fails
    console.error(`Error: ${error.message}`);
    
    // Exit process with failure code
    // This prevents server from running without database connection
    process.exit(1);
  }
};

// Export the connection function to be used in server.js
module.exports = connectDB;
