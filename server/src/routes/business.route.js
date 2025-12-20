/**
 * BUSINESS ROUTES
 * ===============
 * Routes for business account management and API key operations
 * 
 * SECURITY: All business-specific endpoints require:
 * 1. Authentication (auth middleware)
 * 2. Business account type (requireBusiness middleware)
 * 
 * This prevents personal/customer accounts from accessing business APIs.
 */

const express = require("express");
const router = express.Router();
const businessController = require("../controllers/business.controller");

const { 
  auth, 
  checkRole, 
  validateBusinessRegistration,
  requireBusiness,
  requireVerifiedBusiness,
} = require("../middlewares");

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * POST /api/business/register
 * Register a new business account
 */
router.post("/register", validateBusinessRegistration, businessController.registerBusiness);

// ============================================
// PROTECTED ROUTES (Business accounts only)
// ============================================

/**
 * GET /api/business/profile
 * Get business profile
 * SECURITY: Only business account types can access
 */
router.get("/profile", auth, requireBusiness, businessController.getBusinessProfile);

/**
 * POST /api/business/api-keys
 * Generate a new API key
 * SECURITY: Requires verified business account
 */
router.post("/api-keys", auth, requireVerifiedBusiness, businessController.generateAPIKey);

/**
 * GET /api/business/api-keys
 * List all API keys for the business
 * SECURITY: Only business account types can access
 */
router.get("/api-keys", auth, requireBusiness, businessController.listAPIKeys);

/**
 * DELETE /api/business/api-keys/:keyId
 * Revoke an API key
 * SECURITY: Only business account types can access
 */
router.delete("/api-keys/:keyId", auth, requireBusiness, businessController.revokeAPIKey);

// ============================================
// CORS / ALLOWED ORIGINS MANAGEMENT
// ============================================

/**
 * GET /api/business/api-keys/:keyId/origins
 * Get allowed origins for an API key
 * SECURITY: Only business account types can access their own keys
 */
router.get("/api-keys/:keyId/origins", auth, requireBusiness, businessController.getKeyOrigins);

/**
 * PUT /api/business/api-keys/:keyId/origins
 * Update allowed origins for an API key
 * SECURITY: Only business account types can access their own keys
 */
router.put("/api-keys/:keyId/origins", auth, requireBusiness, businessController.updateKeyOrigins);

/**
 * POST /api/business/api-keys/:keyId/origins
 * Add a new allowed origin to an API key
 * SECURITY: Only business account types can access their own keys
 */
router.post("/api-keys/:keyId/origins", auth, requireBusiness, businessController.addKeyOrigin);

/**
 * DELETE /api/business/api-keys/:keyId/origins
 * Remove an allowed origin from an API key
 * SECURITY: Only business account types can access their own keys
 */
router.delete("/api-keys/:keyId/origins", auth, requireBusiness, businessController.removeKeyOrigin);

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
