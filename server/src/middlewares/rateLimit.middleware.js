// middlewares/rateLimit.middleware.js

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Configurable rate limiting based on environment variables
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW) || 15; // minutes
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX) || 100; // max requests

const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW * 60 * 1000,
  max: RATE_LIMIT_MAX,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later'
    });
  }
});


const speedLimiter = slowDown({
  windowMs: RATE_LIMIT_WINDOW * 60 * 1000,
  delayAfter: Math.floor(RATE_LIMIT_MAX / 4), // Allow 25% of max requests, then add delay
  delayMs: () => 500 // Always add 500ms delay per request above threshold (new v2 behavior)
});

module.exports = {
  limiter,
  speedLimiter,
};