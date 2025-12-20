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
    const { businessName, businessType, businessAddress, businessPhone } = businessInfo;

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
    const { name, permissions } = req.body;

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

    // Create the API key
    const { apiKey, plainKey } = await APIKey.createKey(
      userId,
      name,
      permissions || ["charge", "transactions"]
    );

    res.status(201).json({
      success: true,
      message: "API key generated successfully. Save this key securely - it won't be shown again.",
      data: {
        key: plainKey, // Only shown once!
        keyPrefix: apiKey.keyPrefix,
        name: apiKey.name,
        permissions: apiKey.permissions,
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

module.exports = {
  registerBusiness,
  generateAPIKey,
  listAPIKeys,
  revokeAPIKey,
  getBusinessProfile,
  verifyBusiness,
  getPendingBusinesses,
  getVerifiedBusinesses,
};
