/**
 * APP.JS
 * ======
 * Main Express app configuration.
 * - Sets up middleware (JSON parsing, CORS, etc.)
 * - Mounts all routes (internal & public API)
 * - Handles 404 and error responses
 */

const express = require("express");
const helmet = require("helmet");
const hpp = require("hpp");

// Import v1 routes (for API versioning)
const v1Routes = require("./routes/v1");

const { logger, limiter, speedLimiter, errorHandler, mongoSanitize, sanitize, dynamicCors } = require("./middlewares");

const app = express();

// Trust proxy for production deployments (Vercel, Heroku, etc.)
app.set('trust proxy', 1);

// 1. Security Middleware
app.use(helmet()); // Secure HTTP headers
app.use(mongoSanitize); // Prevent MongoDB injection (Express 5.x compatible)
app.use(hpp()); // Prevent HTTP Parameter Pollution

// 2. Dynamic CORS Middleware
// - Internal routes: permissive CORS for frontend apps
// - Public API routes: validates Origin against API key's allowedOrigins
app.use(dynamicCors);

// 3. Global Middleware
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies with size limit
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Parse URL-encoded bodies
app.use(sanitize); // SECURITY: Sanitize all inputs to prevent XSS attacks
app.use(logger); // Log every request

// 4. Rate Limiting & Speed Control
app.use("/api/", limiter, speedLimiter);

// ============================================
// 5. API VERSION 1 ROUTES
// ============================================
// All routes are now under /api/v1/* for versioning
app.use("/api/v1", v1Routes);

// 6. Health Check Endpoint (for production monitoring)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// 7. Root route (API info)
app.get("/", (req, res) => {
  res.json({ 
    success: true, 
    message: "Smart City Banking API is running!",
    version: "2.0.0",
    apiVersion: "v1",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      users: "/api/v1/users",
      transactions: "/api/v1/transactions",
      business: "/api/v1/business",
      public: "/api/v1/public",
      health: "/api/health",
    },
  });
});

// 8. 404 Handler (for unmatched routes)
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// 9. Error Handler (must be last)
app.use(errorHandler);

module.exports = app;
