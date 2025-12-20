/**
 * APP.JS
 * ======
 * Main Express app configuration.
 * - Sets up middleware (JSON parsing, CORS, etc.)
 * - Mounts all routes (internal & public API)
 * - Handles 404 and error responses
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");

const userRoutes = require("./routes/user.route");
const transactionRoutes = require("./routes/transaction.route");
const publicTransactionRoutes = require("./routes/public.transaction.route");
const businessRoutes = require("./routes/business.route");

const { logger, limiter, speedLimiter, errorHandler, mongoSanitize } = require("./middlewares");

const app = express();

// 1. Security Middleware
app.use(helmet()); // Secure HTTP headers
app.use(mongoSanitize); // Prevent MongoDB injection (Express 5.x compatible)
app.use(hpp()); // Prevent HTTP Parameter Pollution

// 2. Global Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies with size limit
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Parse URL-encoded bodies
app.use(logger); // Log every request

// 3. Rate Limiting & Speed Control
app.use("/api/", limiter, speedLimiter);

// ============================================
// 4. INTERNAL API ROUTES (JWT Authentication)
// ============================================
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/business", businessRoutes);

// ============================================
// 5. PUBLIC API ROUTES (API Key Authentication)
// For external Smart City integrations
// ============================================
app.use("/api/public", publicTransactionRoutes);

// 6. Root route (API info)
app.get("/", (req, res) => {
  res.json({ 
    success: true, 
    message: "Smart City Banking API is running!",
    version: "2.0.0",
    endpoints: {
      internal: {
        users: "/api/users",
        transactions: "/api/transactions",
        business: "/api/business",
      },
      public: {
        base: "/api/public",
        charge: "/api/public/transactions/charge",
        refund: "/api/public/transactions/refund",
        verify: "/api/public/cards/verify",
      },
    },
  });
});

// 6. 404 Handler (for unmatched routes)
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// 7. Error Handler (must be last)
app.use(errorHandler);

module.exports = app;
