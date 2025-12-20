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

const Transaction = mongoose.model("Transaction", TransactionSchema);

module.exports = Transaction;