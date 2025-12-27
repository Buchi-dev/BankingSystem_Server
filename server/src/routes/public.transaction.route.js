/**
 * PUBLIC TRANSACTION ROUTES
 * =========================
 * API routes for external system integrations (Smart City)
 * All routes require API key authentication via X-API-Key header
 */

const express = require("express");
const router = express.Router();


const publicTransactionController = require("../controllers/public.transaction.controller");
const {
  apiAuth,
  requirePermission,
  checkTransactionLimit,
} = require("../middlewares/apiAuth.middleware");
const { validateCardCharge, validateRefund } = require("../middlewares/validation.middleware");
const { cardVerifyLimiter } = require("../middlewares/rateLimit.middleware");

// ============================================
// ALL ROUTES REQUIRE API KEY AUTHENTICATION
// ============================================

// Apply API authentication to all routes
router.use(apiAuth);

// ============================================
// API KEY VERIFICATION / WELCOME ENDPOINT
// ============================================

/**
 * GET /api/public/verify
 * Verify API key is working and get business info
 * No specific permission required - just valid API key
 * 
 * Use this endpoint to:
 * - Test if your API key is properly configured
 * - Verify CORS origins are working
 * - Get business information associated with the key
 */
router.get("/verify", publicTransactionController.verifyApiKey);

// ============================================
// PAYMENT ENDPOINTS
// ============================================

/**
 * POST /api/public/transactions/charge
 * Charge a customer's card
 * Required permission: charge
 */
router.post(
  "/transactions/charge",
  requirePermission("charge"),
  checkTransactionLimit,
  validateCardCharge,
  publicTransactionController.chargeCard
);

/**
 * POST /api/public/transactions/refund
 * Process a refund for a previous transaction
 * Required permission: refund
 */
router.post(
  "/transactions/refund",
  requirePermission("refund"),
  validateRefund,
  publicTransactionController.refundTransaction
);

// ============================================
// TRANSACTION QUERY ENDPOINTS
// ============================================

/**
 * GET /api/public/transactions
 * Get all transactions for the business
 * Required permission: transactions
 */
router.get(
  "/transactions",
  requirePermission("transactions"),
  publicTransactionController.getBusinessTransactions
);

/**
 * GET /api/public/transactions/:reference
 * Get a specific transaction by reference ID
 * Required permission: transactions
 */
router.get(
  "/transactions/:reference",
  requirePermission("transactions"),
  publicTransactionController.getTransaction
);

// ============================================
// CARD VERIFICATION ENDPOINTS
// ============================================

/**
 * POST /api/public/cards/verify
 * Verify a card without charging
 * Required permission: charge (same as charging)
 * Strict rate limiting to prevent CVV brute force attacks
 */
// const cardVerifyLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // 5 attempts per window
//   standardHeaders: true,
//   legacyHeaders: false,
//   handler: (req, res) => {
//     res.status(429).json({
//       success: false,
//       message: "Too many card verification attempts, please try again after 15 minutes",
//     });
//   },
// });

router.post(
  "/cards/verify",
  cardVerifyLimiter,
  requirePermission("charge"),
  publicTransactionController.verifyCard
);

// ============================================
// BUSINESS ACCOUNT ENDPOINTS
// ============================================

/**
 * GET /api/public/balance
 * Get business wallet balance
 * Required permission: balance
 */
router.get(
  "/balance",
  requirePermission("balance"),
  publicTransactionController.getBusinessBalance
);

module.exports = router;
