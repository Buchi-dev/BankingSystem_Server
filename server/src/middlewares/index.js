const auth = require('./auth.middleware');
const errorHandler = require('./errorHandler.middleware');
const logger = require('./loggers.middleware');
const { limiter, speedLimiter} = require('./rateLimit.middleware');
const checkRole = require('./role.middleware');
const { validateUser, validateRegistration, validateTransaction} = require('./validation.middleware');
const mongoSanitize = require('./mongoSanitize.middleware');

module.exports = {
  auth,
  errorHandler,
  logger,
  limiter,
  speedLimiter,
  checkRole,
  validateUser,
  validateRegistration,
  mongoSanitize,
  validateTransaction,
};