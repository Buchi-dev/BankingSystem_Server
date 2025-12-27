const auth = require('./auth.middleware');
const errorHandler = require('./errorHandler.middleware');
const logger = require('./loggers.middleware');
const { limiter, speedLimiter, loginLimiter, cardVerifyLimiter} = require('./rateLimit.middleware');
const checkRole = require('./role.middleware');
const { 
  validateUser, 
  validateRegistration, 
  validateTransaction, 
  validateDeposit, 
  validateWithdraw,
  validateCardCharge,
  validateRefund,
  validateBusinessRegistration,
} = require('./validation.middleware');
const mongoSanitize = require('./mongoSanitize.middleware');
const sanitize = require('./sanitize.middleware');
const { requireBusiness, requireVerifiedBusiness } = require('./business.middleware');
const { apiAuth, requirePermission, checkTransactionLimit } = require('./apiAuth.middleware');
const { dynamicCors, internalCors } = require('./cors.middleware');

module.exports = {
  auth,
  errorHandler,
  logger,
  limiter,
  speedLimiter,
  loginLimiter,
  cardVerifyLimiter,
  checkRole,
  validateUser,
  validateRegistration,
  mongoSanitize,
  validateTransaction,
  validateDeposit,
  validateWithdraw,
  validateCardCharge,
  validateRefund,
  validateBusinessRegistration,
  apiAuth,
  requirePermission,
  checkTransactionLimit,
  sanitize,
  requireBusiness,
  requireVerifiedBusiness,
  dynamicCors,
  internalCors,
};