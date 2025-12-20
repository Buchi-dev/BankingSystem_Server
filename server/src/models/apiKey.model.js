/**
 * API KEY MODEL
 * =============
 * Schema for managing API keys for business integrations
 * External systems (food vendors, merchants) use these keys to access public APIs
 */

const mongoose = require("mongoose");
const { generateAPIKey, hashAPIKey } = require("../utils/cardGenerator");

const APIKeySchema = new mongoose.Schema(
  {
    // Reference to the business user
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The hashed API key (we never store plain keys)
    keyHash: {
      type: String,
      required: true,
      unique: true,
    },

    // Key prefix for identification (first 12 chars of plain key)
    keyPrefix: {
      type: String,
      required: true,
    },

    // Human-readable name for this key
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    // Permissions granted to this key
    permissions: {
      type: [String],
      enum: [
        "charge",        // Can charge customer cards
        "refund",        // Can process refunds
        "balance",       // Can check own business balance
        "transactions",  // Can view transaction history
      ],
      default: ["charge", "transactions"],
    },

    // Rate limiting configuration
    rateLimit: {
      requestsPerMinute: {
        type: Number,
        default: 60,
        min: 1,
        max: 1000,
      },
      requestsPerDay: {
        type: Number,
        default: 10000,
        min: 100,
        max: 100000,
      },
    },

    // Usage tracking
    usage: {
      totalRequests: {
        type: Number,
        default: 0,
      },
      lastUsed: {
        type: Date,
      },
      dailyRequests: {
        type: Number,
        default: 0,
      },
      lastResetDate: {
        type: Date,
        default: Date.now,
      },
    },

    // Transaction limits
    transactionLimits: {
      maxAmountPerTransaction: {
        type: Number,
        default: 100000, // PHP 100,000
      },
      dailyTransactionLimit: {
        type: Number,
        default: 500000, // PHP 500,000 per day
      },
      dailyTransactionTotal: {
        type: Number,
        default: 0,
      },
    },

    // Key status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Environment (for future live/test mode support)
    environment: {
      type: String,
      enum: ["live", "test"],
      default: "live",
    },

    // IP whitelist (optional security)
    ipWhitelist: {
      type: [String],
      default: [],
    },

    // Expiry date (optional)
    expiresAt: {
      type: Date,
    },

    // Revocation info
    revokedAt: {
      type: Date,
    },
    revokedReason: {
      type: String,
    },
  },
  { timestamps: true }
);

// Index for fast key lookup
APIKeySchema.index({ keyHash: 1 });
APIKeySchema.index({ business: 1, isActive: 1 });

// Static method to create a new API key
APIKeySchema.statics.createKey = async function (businessId, name, permissions = ["charge", "transactions"]) {
  const plainKey = generateAPIKey("scb_live_");
  const keyHash = hashAPIKey(plainKey);
  const keyPrefix = plainKey.substring(0, 12);

  const apiKey = await this.create({
    business: businessId,
    keyHash,
    keyPrefix,
    name,
    permissions,
  });

  // Return both the document and the plain key (shown only once)
  return {
    apiKey,
    plainKey, // This should be shown to the user only once
  };
};

// Static method to find and validate an API key
APIKeySchema.statics.findByKey = async function (plainKey) {
  if (!plainKey || !plainKey.startsWith("scb_")) {
    return null;
  }

  const keyHash = hashAPIKey(plainKey);
  const apiKey = await this.findOne({ keyHash, isActive: true }).populate(
    "business",
    "fullName email businessInfo accountType"
  );

  if (!apiKey) {
    return null;
  }

  // Check if key is expired
  if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
    return null;
  }

  // Check if key is revoked
  if (apiKey.revokedAt) {
    return null;
  }

  return apiKey;
};

// Method to check if key has permission
APIKeySchema.methods.hasPermission = function (permission) {
  return this.permissions.includes(permission);
};

// Method to check rate limit
APIKeySchema.methods.checkRateLimit = function () {
  // Reset daily counter if new day
  const today = new Date().toDateString();
  const lastReset = new Date(this.usage.lastResetDate).toDateString();

  if (today !== lastReset) {
    this.usage.dailyRequests = 0;
    this.usage.lastResetDate = new Date();
    this.transactionLimits.dailyTransactionTotal = 0;
  }

  return this.usage.dailyRequests < this.rateLimit.requestsPerDay;
};

// Method to record API usage
APIKeySchema.methods.recordUsage = function () {
  this.usage.totalRequests += 1;
  this.usage.dailyRequests += 1;
  this.usage.lastUsed = new Date();
};

// Method to check transaction limit
APIKeySchema.methods.canProcessTransaction = function (amount) {
  // Reset daily counter if new day
  const today = new Date().toDateString();
  const lastReset = new Date(this.usage.lastResetDate).toDateString();

  if (today !== lastReset) {
    this.transactionLimits.dailyTransactionTotal = 0;
  }

  // Check per-transaction limit
  if (amount > this.transactionLimits.maxAmountPerTransaction) {
    return { allowed: false, reason: "Amount exceeds maximum per transaction limit" };
  }

  // Check daily limit
  if (this.transactionLimits.dailyTransactionTotal + amount > this.transactionLimits.dailyTransactionLimit) {
    return { allowed: false, reason: "Daily transaction limit exceeded" };
  }

  return { allowed: true };
};

// Method to record transaction amount
APIKeySchema.methods.recordTransaction = function (amount) {
  this.transactionLimits.dailyTransactionTotal += amount;
};

// Method to check IP whitelist
APIKeySchema.methods.isIPAllowed = function (ip) {
  // If no whitelist, allow all
  if (!this.ipWhitelist || this.ipWhitelist.length === 0) {
    return true;
  }

  return this.ipWhitelist.includes(ip);
};

// Method to revoke key
APIKeySchema.methods.revoke = async function (reason) {
  this.isActive = false;
  this.revokedAt = new Date();
  this.revokedReason = reason;
  return this.save();
};

// Remove sensitive data from JSON
APIKeySchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.keyHash;
  return obj;
};

const APIKey = mongoose.model("APIKey", APIKeySchema);

module.exports = APIKey;
