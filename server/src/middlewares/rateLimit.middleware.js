// middlewares/rateLimit.middleware.js

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later'
    });
  }
});


const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 25, // Allow 25 requests per 15 minutes, then...
  delayMs: () => 500 // Always add 500ms delay per request above 50 (new v2 behavior)
});

module.exports = {
  limiter,
  speedLimiter,
};