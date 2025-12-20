/**
 * API AUTHENTICATION MIDDLEWARE
 * =============================
 * Middleware for authenticating API requests from external systems
 * Validates X-API-Key header and attaches business context to request
 */

const APIKey = require("../models/apiKey.model");

/**
 * API Key Authentication Middleware
 * Validates the X-API-Key header and attaches business context to request
 */
const apiAuth = async (req, res, next) => {
  try {
    // Get API key from header
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: {
          code: "MISSING_API_KEY",
          message: "API key is required. Provide it in the X-API-Key header.",
        },
      });
    }

    // Validate key format
    if (!apiKey.startsWith("scb_")) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_API_KEY_FORMAT",
          message: "Invalid API key format.",
        },
      });
    }

    // Find and validate the API key
    const keyDocument = await APIKey.findByKey(apiKey);

    if (!keyDocument) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_API_KEY",
          message: "Invalid or expired API key.",
        },
      });
    }

    // Check if business account is verified
    if (!keyDocument.business?.businessInfo?.isVerified) {
      return res.status(403).json({
        success: false,
        error: {
          code: "BUSINESS_NOT_VERIFIED",
          message: "Business account is not verified. Please complete verification first.",
        },
      });
    }

    // Check IP whitelist
    const clientIP = req.ip || req.connection.remoteAddress;
    if (!keyDocument.isIPAllowed(clientIP)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "IP_NOT_ALLOWED",
          message: "Request from this IP address is not allowed.",
        },
      });
    }

    // Check rate limit
    if (!keyDocument.checkRateLimit()) {
      return res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "API rate limit exceeded. Please try again later.",
        },
      });
    }

    // Record usage
    keyDocument.recordUsage();
    await keyDocument.save();

    // Attach API key and business info to request
    req.apiKey = keyDocument;
    req.business = keyDocument.business;

    next();
  } catch (error) {
    console.error("API Auth Error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Authentication failed due to internal error.",
      },
    });
  }
};

/**
 * Permission Check Middleware Factory
 * Creates middleware that checks if API key has required permission
 * @param {string} permission - Required permission (charge, refund, balance, transactions)
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({
        success: false,
        error: {
          code: "NOT_AUTHENTICATED",
          message: "API authentication required.",
        },
      });
    }

    if (!req.apiKey.hasPermission(permission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "PERMISSION_DENIED",
          message: `This API key does not have '${permission}' permission.`,
        },
      });
    }

    next();
  };
};

/**
 * Transaction Limit Check Middleware
 * Checks if the API key can process a transaction of given amount
 */
const checkTransactionLimit = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!req.apiKey) {
      return res.status(401).json({
        success: false,
        error: {
          code: "NOT_AUTHENTICATED",
          message: "API authentication required.",
        },
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_AMOUNT",
          message: "Valid amount is required.",
        },
      });
    }

    const limitCheck = req.apiKey.canProcessTransaction(amount);

    if (!limitCheck.allowed) {
      return res.status(400).json({
        success: false,
        error: {
          code: "TRANSACTION_LIMIT_EXCEEDED",
          message: limitCheck.reason,
        },
      });
    }

    next();
  } catch (error) {
    console.error("Transaction Limit Check Error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to verify transaction limits.",
      },
    });
  }
};

module.exports = {
  apiAuth,
  requirePermission,
  checkTransactionLimit,
};
