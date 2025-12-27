const mongoose = require("mongoose");
const crypto = require('crypto');

// Use native crypto.randomUUID (Node.js 14.17+) for generating UUIDs
const generateUUID = () => crypto.randomUUID();

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function () { return this.type !== "transfer" && this.type !== "payment"; },
  },
  // New fields for transfer transparency
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function () { return this.type === "transfer" || this.type === "payment"; },
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function () { return this.type === "transfer" || this.type === "payment"; },
  },
  type: {
    type: String,
    enum: ["deposit", "withdraw", "transfer", "payment", "refund"],
    required: true,
  },
  // Transaction category: B2B (Business-to-Business), B2C (Business-to-Consumer), C2C (Consumer-to-Consumer)
  // Auto-determined based on account types of from/to users
  transactionCategory: {
    type: String,
    enum: ["B2B", "B2C", "C2C"],
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },

  // ============================================
  // PAYMENT-SPECIFIC FIELDS (for external API transactions)
  // ============================================
  
  // Payment method used
  paymentMethod: {
    type: String,
    enum: ["wallet", "card", "api"],
    default: "wallet",
  },

  // Card used for payment (masked for security)
  cardUsed: {
    last4: {
      type: String,
      maxlength: 4,
    },
    cardType: {
      type: String,
      default: "SmartCity",
    },
  },

  // Merchant/Business that processed the payment
  merchant: {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    businessName: {
      type: String,
    },
    apiKeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "APIKey",
    },
  },

  // External reference from merchant system
  externalReference: {
    type: String,
    maxlength: 100,
  },

  // Description/memo for the transaction
  description: {
    type: String,
    maxlength: 200,
  },

  // Transaction status (for async processing)
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "completed",
  },

  // Refund reference (if this is a refund, reference to original transaction)
  originalTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
  },

  // ============================================
  // BALANCE TRACKING FIELDS
  // ============================================

  // For deposit/withdraw (single user)
  balanceBefore: {
    type: Number,
    min: 0,
    required: function () { return this.type === "deposit" || this.type === "withdraw"; },
  },
  balanceAfter: {
    type: Number,
    min: 0,
    required: function () { return this.type === "deposit" || this.type === "withdraw"; },
  },
  // For transfers and payments (sender and receiver)
  fromBalanceBefore: {
    type: Number,
    min: 0,
    required: function () { return this.type === "transfer" || this.type === "payment"; },
  },
  fromBalanceAfter: {
    type: Number,
    min: 0,
    required: function () { return this.type === "transfer" || this.type === "payment"; },
  },
  toBalanceBefore: {
    type: Number,
    min: 0,
    required: function () { return this.type === "transfer" || this.type === "payment"; },
  },
  toBalanceAfter: {
    type: Number,
    min: 0,
    required: function () { return this.type === "transfer" || this.type === "payment"; },
  },
  reference: {
    type: String,
    required: true,
    unique: true,
    default: () => generateUUID(),
  },
}, { timestamps: true });

// Indexes for efficient queries
TransactionSchema.index({ reference: 1 });
TransactionSchema.index({ from: 1, createdAt: -1 });
TransactionSchema.index({ to: 1, createdAt: -1 });
TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ "merchant.businessId": 1, createdAt: -1 });
TransactionSchema.index({ externalReference: 1, "merchant.businessId": 1 });
TransactionSchema.index({ transactionCategory: 1, createdAt: -1 });

/**
 * Determine transaction category based on account types
 * @param {string} fromAccountType - Account type of sender ("personal" or "business")
 * @param {string} toAccountType - Account type of recipient ("personal" or "business")
 * @returns {string|null} - "B2B", "B2C", "C2C", or null if cannot determine
 */
TransactionSchema.statics.determineCategory = function(fromAccountType, toAccountType) {
  if (!fromAccountType || !toAccountType) {
    return null;
  }

  // Both are business accounts = B2B
  if (fromAccountType === "business" && toAccountType === "business") {
    return "B2B";
  }

  // Both are personal accounts = C2C
  if (fromAccountType === "personal" && toAccountType === "personal") {
    return "C2C";
  }

  // Mixed (one business, one personal) = B2C
  if (
    (fromAccountType === "business" && toAccountType === "personal") ||
    (fromAccountType === "personal" && toAccountType === "business")
  ) {
    return "B2C";
  }

  return null;
};

// Pre-save hook to auto-determine transaction category if not set
// Note: Controllers should explicitly set transactionCategory, but this serves as a fallback
TransactionSchema.pre("save", async function(next) {
  // Only determine category for transfer, payment, and refund types that have from/to
  if ((this.type === "transfer" || this.type === "payment" || this.type === "refund") && this.from && this.to) {
    // If category is not already set, try to determine it
    if (!this.transactionCategory) {
      try {
        // Check if from/to are already populated (as objects) or just ObjectIds
        let fromAccountType = null;
        let toAccountType = null;

        // If populated, get accountType directly
        if (this.populated("from") && this.from && typeof this.from === "object" && this.from.accountType) {
          fromAccountType = this.from.accountType;
        }
        if (this.populated("to") && this.to && typeof this.to === "object" && this.to.accountType) {
          toAccountType = this.to.accountType;
        }

        // If not populated, try to populate (but this might not work in all cases)
        if (!fromAccountType || !toAccountType) {
          try {
            await this.populate("from", "accountType");
            await this.populate("to", "accountType");
            if (this.from && typeof this.from === "object" && this.from.accountType) {
              fromAccountType = this.from.accountType;
            }
            if (this.to && typeof this.to === "object" && this.to.accountType) {
              toAccountType = this.to.accountType;
            }
          } catch (populateError) {
            // Population failed, will skip category determination
          }
        }

        // If we have both account types, determine category
        if (fromAccountType && toAccountType) {
          this.transactionCategory = Transaction.determineCategory(fromAccountType, toAccountType);
        }
      } catch (error) {
        // If determination fails, category will remain unset
        // This is okay - controllers should set it explicitly
      }
    }
  }
  next();
});

const Transaction = mongoose.model("Transaction", TransactionSchema);

module.exports = Transaction;