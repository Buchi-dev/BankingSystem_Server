const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function () { return this.type !== "transfer"; },
  },
  // New fields for transfer transparency
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function () { return this.type === "transfer"; },
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function () { return this.type === "transfer"; },
  },
  type: {
    type: String,
    enum: ["deposit", "withdraw", "transfer"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  // For deposit/withdraw (single user)
  balanceBefore: {
    type: Number,
    min: 0,
    required: function () { return this.type !== "transfer"; },
  },
  balanceAfter: {
    type: Number,
    min: 0,
    required: function () { return this.type !== "transfer"; },
  },
  // For transfers (sender and receiver)
  fromBalanceBefore: {
    type: Number,
    min: 0,
    required: function () { return this.type === "transfer"; },
  },
  fromBalanceAfter: {
    type: Number,
    min: 0,
    required: function () { return this.type === "transfer"; },
  },
  toBalanceBefore: {
    type: Number,
    min: 0,
    required: function () { return this.type === "transfer"; },
  },
  toBalanceAfter: {
    type: Number,
    min: 0,
    required: function () { return this.type === "transfer"; },
  },
  reference: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4(),
  },
}, { timestamps: true });

const Transaction = mongoose.model("Transaction", TransactionSchema);

module.exports = Transaction;