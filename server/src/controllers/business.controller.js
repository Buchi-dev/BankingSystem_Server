/**
 * BUSINESS CONTROLLER
 * ===================
 * Handles business account management and API key operations
 * - Business registration
 * - API key generation and management
 * - Business verification (admin only)
 */

const User = require("../models/user.model");
const APIKey = require("../models/apiKey.model");
const jwt = require("jsonwebtoken");
const { maskCardNumber } = require("../utils/cardGenerator");

/**
 * Register a new business account
 * POST /api/business/register
 */
const registerBusiness = async (req, res, next) => {
  try {
    const {
      fullName = {},
      email,
      password,
      businessInfo = {},
    } = req.body;

    const { firstName, lastName, middleInitial } = fullName;
    const { businessName, businessType, businessAddress, businessPhone, websiteUrl } = businessInfo;

    // Validate websiteUrl is required for business registration
    if (!websiteUrl) {
      return res.status(400).json({
        success: false,
        message: "Website URL is required for business registration. This will be used for CORS whitelisting.",
      });
    }

    // Validate websiteUrl format
    const urlPattern = /^https?:\/\/[\w.-]+(:\d+)?(\/.*)?$/;
    if (!urlPattern.test(websiteUrl)) {
      return res.status(400).json({
        success: false,
        message: "Invalid website URL format. Must start with http:// or https://",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create business user (no virtual card for business accounts)
    const user = await User.create({
      fullName: { firstName, lastName, middleInitial },
      email,
      password,
      role: "user",
      accountType: "business",
      businessInfo: {
        businessName,
        businessType,
        businessAddress,
        businessPhone,
        websiteUrl,
        isVerified: false, // Requires admin verification
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, accountType: user.accountType },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    res.status(201).json({
      success: true,
      message: "Business account registered successfully. Awaiting verification.",
      data: {
        user: {
          id: user._id,
          firstName: user.fullName.firstName,
          lastName: user.fullName.lastName,
          email: user.email,
          accountType: user.accountType,
          businessInfo: {
            businessName: user.businessInfo.businessName,
            businessType: user.businessInfo.businessType,
            websiteUrl: user.businessInfo.websiteUrl,
            isVerified: user.businessInfo.isVerified,
          },
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a new API key for the business
 * POST /api/business/api-keys
 */
const generateAPIKey = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, permissions, allowedOrigins, environment = "live" } = req.body;

    // Get user and verify it's a business account
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.accountType !== "business") {
      return res.status(403).json({
        success: false,
        message: "Only business accounts can generate API keys",
      });
    }

    if (!user.businessInfo?.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Business must be verified before generating API keys",
      });
    }

    // Check existing API keys count (limit to 5 per business)
    const existingKeysCount = await APIKey.countDocuments({
      business: userId,
      isActive: true,
    });

    if (existingKeysCount >= 5) {
      return res.status(400).json({
        success: false,
        message: "Maximum number of API keys (5) reached. Please revoke an existing key first.",
      });
    }

    // Validate key name
    if (!name || name.length < 3) {
      return res.status(400).json({
        success: false,
        message: "API key name is required and must be at least 3 characters",
      });
    }

    // Validate environment
    if (environment && !["live", "test"].includes(environment)) {
      return res.status(400).json({
        success: false,
        message: "Environment must be 'live' or 'test'",
      });
    }

    // Prepare allowed origins - auto-populate with business websiteUrl if not provided
    let originsToUse = allowedOrigins || [];
    
    // If no origins provided, use the business websiteUrl as default
    if (originsToUse.length === 0 && user.businessInfo?.websiteUrl) {
      // Extract origin from websiteUrl (remove path if any)
      const url = new URL(user.businessInfo.websiteUrl);
      originsToUse = [url.origin];
    }

    // Validate origins are not empty for live environment
    if (environment === "live" && originsToUse.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one allowed origin is required for live API keys. Your business websiteUrl will be used by default.",
      });
    }

    // Validate origin patterns
    const urlPattern = /^https?:\/\/(\*\.)?[\w.-]+(:\d+)?$/;
    for (const origin of originsToUse) {
      // Block dangerous wildcards
      if (origin === "*" || origin === "http://*" || origin === "https://*") {
        return res.status(400).json({
          success: false,
          message: "Wildcard-only origins (*) are not allowed for security reasons.",
        });
      }
      
      // Localhost only allowed for test keys
      if ((origin.includes("localhost") || origin.includes("127.0.0.1")) && environment !== "test") {
        return res.status(400).json({
          success: false,
          message: "Localhost origins are only allowed for test environment keys.",
        });
      }
      
      if (!urlPattern.test(origin)) {
        return res.status(400).json({
          success: false,
          message: `Invalid origin format: ${origin}. Use format: https://domain.com or https://*.domain.com`,
        });
      }
    }

    // Create the API key with allowed origins
    const { apiKey, plainKey } = await APIKey.createKey(
      userId,
      name,
      permissions || ["charge", "transactions"],
      originsToUse,
      environment
    );

    res.status(201).json({
      success: true,
      message: "API key generated successfully. Save this key securely - it won't be shown again.",
      data: {
        key: plainKey, // Only shown once!
        keyPrefix: apiKey.keyPrefix,
        name: apiKey.name,
        permissions: apiKey.permissions,
        allowedOrigins: apiKey.allowedOrigins,
        environment: apiKey.environment,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all API keys for the business
 * GET /api/business/api-keys
 */
const listAPIKeys = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const apiKeys = await APIKey.find({ business: userId })
      .select("-keyHash")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: apiKeys.length,
      data: apiKeys.map((key) => ({
        id: key._id,
        keyPrefix: key.keyPrefix,
        name: key.name,
        permissions: key.permissions,
        allowedOrigins: key.allowedOrigins || [],
        environment: key.environment,
        isActive: key.isActive,
        usage: {
          totalRequests: key.usage.totalRequests,
          lastUsed: key.usage.lastUsed,
        },
        createdAt: key.createdAt,
        revokedAt: key.revokedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke an API key
 * DELETE /api/business/api-keys/:keyId
 */
const revokeAPIKey = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;
    const { reason } = req.body;

    const apiKey = await APIKey.findOne({
      _id: keyId,
      business: userId,
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: "API key not found",
      });
    }

    if (!apiKey.isActive) {
      return res.status(400).json({
        success: false,
        message: "API key is already revoked",
      });
    }

    await apiKey.revoke(reason || "Revoked by user");

    res.status(200).json({
      success: true,
      message: "API key revoked successfully",
      data: {
        keyPrefix: apiKey.keyPrefix,
        name: apiKey.name,
        revokedAt: apiKey.revokedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get business profile with card details
 * GET /api/business/profile
 */
const getBusinessProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get API key count
    const apiKeyCount = await APIKey.countDocuments({
      business: userId,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        accountType: user.accountType,
        businessInfo: user.businessInfo,
        wallet: {
          balance: parseFloat(user.wallet.balance.toString()),
          currency: user.wallet.currency,
        },
        apiKeyCount,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * Verify a business account (admin only)
 * PUT /api/business/:businessId/verify
 */
const verifyBusiness = async (req, res, next) => {
  try {
    const { businessId } = req.params;

    const business = await User.findOne({
      _id: businessId,
      accountType: "business",
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business account not found",
      });
    }

    if (business.businessInfo.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Business is already verified",
      });
    }

    business.businessInfo.isVerified = true;
    business.businessInfo.verifiedAt = new Date();
    await business.save();

    res.status(200).json({
      success: true,
      message: "Business verified successfully",
      data: {
        id: business._id,
        businessName: business.businessInfo.businessName,
        isVerified: business.businessInfo.isVerified,
        verifiedAt: business.businessInfo.verifiedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all pending business verifications (admin only)
 * GET /api/business/pending
 */
const getPendingBusinesses = async (req, res, next) => {
  try {
    const pendingBusinesses = await User.find({
      accountType: "business",
      "businessInfo.isVerified": false,
    }).select("fullName email businessInfo createdAt");

    res.status(200).json({
      success: true,
      count: pendingBusinesses.length,
      data: pendingBusinesses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all verified businesses (admin only)
 * GET /api/business/verified
 */
const getVerifiedBusinesses = async (req, res, next) => {
  try {
    const verifiedBusinesses = await User.find({
      accountType: "business",
      "businessInfo.isVerified": true,
    }).select("fullName email businessInfo wallet createdAt");

    res.status(200).json({
      success: true,
      count: verifiedBusinesses.length,
      data: verifiedBusinesses.map((b) => ({
        id: b._id,
        fullName: b.fullName,
        email: b.email,
        businessInfo: b.businessInfo,
        balance: parseFloat(b.wallet.balance.toString()),
        createdAt: b.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CORS / ALLOWED ORIGINS MANAGEMENT
// ============================================

/**
 * Validate origin pattern format
 * @param {string} origin - Origin URL or pattern
 * @param {string} environment - 'live' or 'test'
 * @returns {{valid: boolean, error?: string}}
 */
const validateOriginPattern = (origin, environment) => {
  // Block dangerous wildcards
  if (origin === "*" || origin === "http://*" || origin === "https://*") {
    return { valid: false, error: "Wildcard-only origins (*) are not allowed for security reasons." };
  }

  // Localhost only allowed for test keys
  if ((origin.includes("localhost") || origin.includes("127.0.0.1")) && environment !== "test") {
    return { valid: false, error: "Localhost origins are only allowed for test environment keys." };
  }

  // Validate URL pattern (supports wildcards like https://*.domain.com)
  const urlPattern = /^https?:\/\/(\*\.)?[\w.-]+(:\d+)?$/;
  if (!urlPattern.test(origin)) {
    return { valid: false, error: `Invalid origin format: ${origin}. Use format: https://domain.com or https://*.domain.com` };
  }

  return { valid: true };
};

/**
 * Get allowed origins for an API key
 * GET /api/business/api-keys/:keyId/origins
 */
const getKeyOrigins = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;

    const apiKey = await APIKey.findOne({
      _id: keyId,
      business: userId,
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: "API key not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        keyId: apiKey._id,
        keyPrefix: apiKey.keyPrefix,
        name: apiKey.name,
        environment: apiKey.environment,
        allowedOrigins: apiKey.allowedOrigins || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update allowed origins for an API key (replace all)
 * PUT /api/business/api-keys/:keyId/origins
 */
const updateKeyOrigins = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;
    const { origins } = req.body;

    if (!Array.isArray(origins)) {
      return res.status(400).json({
        success: false,
        message: "Origins must be an array of URL patterns",
      });
    }

    const apiKey = await APIKey.findOne({
      _id: keyId,
      business: userId,
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: "API key not found",
      });
    }

    if (!apiKey.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot modify a revoked API key",
      });
    }

    // Validate all origins
    for (const origin of origins) {
      const validation = validateOriginPattern(origin, apiKey.environment);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }
    }

    // Update origins
    apiKey.allowedOrigins = origins;
    await apiKey.save();

    res.status(200).json({
      success: true,
      message: "Allowed origins updated successfully",
      data: {
        keyId: apiKey._id,
        keyPrefix: apiKey.keyPrefix,
        allowedOrigins: apiKey.allowedOrigins,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new allowed origin to an API key
 * POST /api/business/api-keys/:keyId/origins
 */
const addKeyOrigin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;
    const { origin } = req.body;

    if (!origin) {
      return res.status(400).json({
        success: false,
        message: "Origin URL is required",
      });
    }

    const apiKey = await APIKey.findOne({
      _id: keyId,
      business: userId,
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: "API key not found",
      });
    }

    if (!apiKey.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot modify a revoked API key",
      });
    }

    // Validate the origin
    const validation = validateOriginPattern(origin, apiKey.environment);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    // Check if origin already exists
    if (apiKey.allowedOrigins.includes(origin)) {
      return res.status(400).json({
        success: false,
        message: "This origin is already in the allowed list",
      });
    }

    // Add origin
    apiKey.allowedOrigins.push(origin);
    await apiKey.save();

    res.status(201).json({
      success: true,
      message: "Origin added successfully",
      data: {
        keyId: apiKey._id,
        keyPrefix: apiKey.keyPrefix,
        allowedOrigins: apiKey.allowedOrigins,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove an allowed origin from an API key
 * DELETE /api/business/api-keys/:keyId/origins
 */
const removeKeyOrigin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;
    const { origin } = req.body;

    if (!origin) {
      return res.status(400).json({
        success: false,
        message: "Origin URL is required",
      });
    }

    const apiKey = await APIKey.findOne({
      _id: keyId,
      business: userId,
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: "API key not found",
      });
    }

    if (!apiKey.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot modify a revoked API key",
      });
    }

    // Check if origin exists
    const originIndex = apiKey.allowedOrigins.indexOf(origin);
    if (originIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Origin not found in the allowed list",
      });
    }

    // Remove origin
    apiKey.allowedOrigins.splice(originIndex, 1);
    await apiKey.save();

    // Warn if no origins left (will block all browser requests)
    const warning = apiKey.allowedOrigins.length === 0
      ? " Warning: No origins configured. All browser requests will be blocked until you add an allowed origin."
      : "";

    res.status(200).json({
      success: true,
      message: `Origin removed successfully.${warning}`,
      data: {
        keyId: apiKey._id,
        keyPrefix: apiKey.keyPrefix,
        allowedOrigins: apiKey.allowedOrigins,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerBusiness,
  generateAPIKey,
  listAPIKeys,
  revokeAPIKey,
  getBusinessProfile,
  verifyBusiness,
  getPendingBusinesses,
  getVerifiedBusinesses,
  // CORS / Origin management
  getKeyOrigins,
  updateKeyOrigins,
  addKeyOrigin,
  removeKeyOrigin,
};
