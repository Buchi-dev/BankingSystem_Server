/**
 * BUSINESS ROUTES
 * ===============
 * Routes for business account management and API key operations
 */

const express = require("express");
const router = express.Router();
const businessController = require("../controllers/business.controller");

const { auth, checkRole, validateBusinessRegistration } = require("../middlewares");

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * POST /api/business/register
 * Register a new business account
 */
router.post("/register", validateBusinessRegistration, businessController.registerBusiness);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

/**
 * GET /api/business/profile
 * Get business profile
 */
router.get("/profile", auth, businessController.getBusinessProfile);

/**
 * POST /api/business/api-keys
 * Generate a new API key
 */
router.post("/api-keys", auth, businessController.generateAPIKey);

/**
 * GET /api/business/api-keys
 * List all API keys for the business
 */
router.get("/api-keys", auth, businessController.listAPIKeys);

/**
 * DELETE /api/business/api-keys/:keyId
 * Revoke an API key
 */
router.delete("/api-keys/:keyId", auth, businessController.revokeAPIKey);

// ============================================
// ADMIN ROUTES (Admin authentication required)
// ============================================

/**
 * GET /api/business/pending
 * Get all pending business verifications
 */
router.get("/pending", auth, checkRole("admin"), businessController.getPendingBusinesses);

/**
 * GET /api/business/verified
 * Get all verified businesses
 */
router.get("/verified", auth, checkRole("admin"), businessController.getVerifiedBusinesses);

/**
 * PUT /api/business/:businessId/verify
 * Verify a business account
 */
router.put("/:businessId/verify", auth, checkRole("admin"), businessController.verifyBusiness);

module.exports = router;
