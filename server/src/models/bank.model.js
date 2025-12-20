/**
 * BANK MODEL
 * ==========
 * Singleton model representing the central bank reserve
 * All deposits come FROM bank balance, all withdrawals go TO bank balance
 * This ensures no void money - all funds are tracked globally
 */

const mongoose = require("mongoose");

// Default initial bank balance (in PHP)
const INITIAL_BANK_BALANCE = process.env.INITIAL_BANK_BALANCE || "10000000.00"; // 10 million PHP

const BankSchema = new mongoose.Schema({
  bankBalance: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    default: mongoose.Types.Decimal128.fromString("0.00"),
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  // Metadata for tracking
  totalDeposits: {
    type: mongoose.Schema.Types.Decimal128,
    default: mongoose.Types.Decimal128.fromString("0.00"),
  },
  totalWithdrawals: {
    type: mongoose.Schema.Types.Decimal128,
    default: mongoose.Types.Decimal128.fromString("0.00"),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Static method to get or create the singleton bank instance
 * Ensures only one bank document exists with initialized balance
 * @param {Object} session - Optional MongoDB session for transactions
 * @returns {Promise<Bank>} The bank document
 */
BankSchema.statics.getOrCreateBank = async function (session = null) {
  const options = session ? { session } : {};
  
  // Try to find existing bank document
  let bank = await this.findOne({}, null, options);
  
  // If no bank exists, create one with initial balance
  if (!bank) {
    const bankData = {
      bankBalance: mongoose.Types.Decimal128.fromString(INITIAL_BANK_BALANCE),
      totalDeposits: mongoose.Types.Decimal128.fromString("0.00"),
      totalWithdrawals: mongoose.Types.Decimal128.fromString("0.00"),
      lastUpdated: new Date(),
      createdAt: new Date(),
    };

    if (session) {
      [bank] = await this.create([bankData], { session });
    } else {
      bank = await this.create(bankData);
    }

    console.log(`✅ Bank initialized with balance: ${INITIAL_BANK_BALANCE} PHP`);
  }
  
  return bank;
};

/**
 * Static method to get current bank balance as a number
 * @returns {Promise<number>} Current bank balance
 */
BankSchema.statics.getBalance = async function () {
  const bank = await this.getOrCreateBank();
  return parseFloat(bank.bankBalance.toString());
};

/**
 * Instance method to update balance and track totals
 * @param {number} amount - Amount to add (positive) or subtract (negative)
 * @param {string} type - 'deposit' or 'withdrawal'
 * @param {Object} session - MongoDB session for transactions
 */
BankSchema.methods.updateBalance = async function (amount, type, session) {
  const currentBalance = parseFloat(this.bankBalance.toString());
  const newBalance = currentBalance + amount;

  if (newBalance < 0) {
    throw new Error("Insufficient bank funds");
  }

  this.bankBalance = mongoose.Types.Decimal128.fromString(newBalance.toFixed(2));
  this.lastUpdated = new Date();

  // Track totals
  if (type === "deposit") {
    // Money going OUT of bank to user wallet
    const totalDep = parseFloat(this.totalDeposits.toString());
    this.totalDeposits = mongoose.Types.Decimal128.fromString(
      (totalDep + Math.abs(amount)).toFixed(2)
    );
  } else if (type === "withdrawal") {
    // Money coming IN to bank from user wallet
    const totalWith = parseFloat(this.totalWithdrawals.toString());
    this.totalWithdrawals = mongoose.Types.Decimal128.fromString(
      (totalWith + Math.abs(amount)).toFixed(2)
    );
  }

  await this.save({ session });
};

const Bank = mongoose.model("Bank", BankSchema);

module.exports = Bank;