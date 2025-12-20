/**
 * PUBLIC TRANSACTION CONTROLLER
 * =============================
 * Handles payment processing for external systems (Smart City integrations)
 * - Card charging for food vendors, merchants, transport, etc.
 * - Refund processing
 * - Transaction lookups
 */

const mongoose = require("mongoose");
const Transaction = require("../models/transaction.model");
const User = require("../models/user.model");
const { validateCardFormat, validateCVVFormat } = require("../utils/cardGenerator");

/**
 * Charge a customer's card
 * POST /api/public/transactions/charge
 * 
 * Request body:
 * {
 *   cardNumber: "4111111111111111",
 *   cvv: "123",
 *   amount: 150.00,
 *   description: "Coffee purchase",
 *   externalReference: "ORDER-12345" (optional)
 * }
 */
const chargeCard = async (req, res, next) => {
  const { cardNumber, cvv, amount, description, externalReference } = req.body;
  const business = req.business;
  const apiKey = req.apiKey;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find customer by card number
    const customer = await User.findByCardNumber(cardNumber)
      .select("+virtualCard.cvv")
      .session(session);

    if (!customer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        error: {
          code: "CARD_NOT_FOUND",
          message: "Card not found or invalid.",
        },
      });
    }

    // Validate card is active
    if (!customer.virtualCard.isActive) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: {
          code: "CARD_INACTIVE",
          message: "This card is not active.",
        },
      });
    }

    // Check if card is expired
    if (customer.isCardExpired()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: {
          code: "CARD_EXPIRED",
          message: "This card has expired.",
        },
      });
    }

    // Verify CVV
    const cvvValid = await customer.compareCVV(cvv);
    if (!cvvValid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_CVV",
          message: "Invalid CVV.",
        },
      });
    }

    // Check daily spending limit
    if (!customer.canSpend(amount)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: {
          code: "DAILY_LIMIT_EXCEEDED",
          message: "Daily spending limit exceeded.",
        },
      });
    }

    // Check customer balance
    const customerBalance = parseFloat(customer.wallet.balance.toString());
    if (customerBalance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: {
          code: "INSUFFICIENT_FUNDS",
          message: "Insufficient funds in card.",
        },
      });
    }

    // Get business account for crediting
    const businessAccount = await User.findById(business._id).session(session);
    if (!businessAccount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({
        success: false,
        error: {
          code: "BUSINESS_NOT_FOUND",
          message: "Business account error.",
        },
      });
    }

    const businessBalance = parseFloat(businessAccount.wallet.balance.toString());

    // Process payment
    customer.wallet.balance = mongoose.Types.Decimal128.fromString(
      (customerBalance - amount).toString()
    );
    businessAccount.wallet.balance = mongoose.Types.Decimal128.fromString(
      (businessBalance + amount).toString()
    );

    // Record spending on card
    customer.recordSpending(amount);

    await customer.save({ session });
    await businessAccount.save({ session });

    // Record transaction amount on API key
    apiKey.recordTransaction(amount);
    await apiKey.save({ session });

    // Create transaction record
    const transaction = new Transaction({
      type: "payment",
      from: customer._id,
      to: business._id,
      amount,
      paymentMethod: "card",
      cardUsed: {
        last4: cardNumber.slice(-4),
        cardType: "SmartCity",
      },
      merchant: {
        businessId: business._id,
        businessName: business.businessInfo?.businessName || "Unknown Business",
        apiKeyId: apiKey._id,
      },
      externalReference,
      description,
      status: "completed",
      fromBalanceBefore: customerBalance,
      fromBalanceAfter: customerBalance - amount,
      toBalanceBefore: businessBalance,
      toBalanceAfter: businessBalance + amount,
    });

    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      data: {
        transactionId: transaction.reference,
        amount: transaction.amount,
        currency: "PHP",
        status: transaction.status,
        cardLast4: transaction.cardUsed.last4,
        description: transaction.description,
        externalReference: transaction.externalReference,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/**
 * Process a refund for a previous transaction
 * POST /api/public/transactions/refund
 * 
 * Request body:
 * {
 *   transactionId: "uuid-reference",
 *   amount: 150.00 (optional - for partial refund),
 *   reason: "Customer returned item"
 * }
 */
const refundTransaction = async (req, res, next) => {
  const { transactionId, amount: refundAmount, reason } = req.body;
  const business = req.business;
  const apiKey = req.apiKey;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find original transaction
    const originalTransaction = await Transaction.findOne({
      reference: transactionId,
      "merchant.businessId": business._id,
      type: "payment",
      status: "completed",
    }).session(session);

    if (!originalTransaction) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        error: {
          code: "TRANSACTION_NOT_FOUND",
          message: "Original transaction not found or not eligible for refund.",
        },
      });
    }

    // Check if already refunded
    const existingRefund = await Transaction.findOne({
      originalTransaction: originalTransaction._id,
      type: "refund",
    }).session(session);

    if (existingRefund) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: {
          code: "ALREADY_REFUNDED",
          message: "This transaction has already been refunded.",
        },
      });
    }

    // Determine refund amount (full or partial)
    const amountToRefund = refundAmount || originalTransaction.amount;

    if (amountToRefund > originalTransaction.amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: {
          code: "REFUND_EXCEEDS_ORIGINAL",
          message: "Refund amount cannot exceed original transaction amount.",
        },
      });
    }

    // Get customer and business accounts
    const customer = await User.findById(originalTransaction.from).session(session);
    const businessAccount = await User.findById(business._id).session(session);

    if (!customer || !businessAccount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({
        success: false,
        error: {
          code: "ACCOUNT_ERROR",
          message: "Error processing refund.",
        },
      });
    }

    const customerBalance = parseFloat(customer.wallet.balance.toString());
    const businessBalance = parseFloat(businessAccount.wallet.balance.toString());

    // Check business has sufficient funds for refund
    if (businessBalance < amountToRefund) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: {
          code: "INSUFFICIENT_BUSINESS_FUNDS",
          message: "Insufficient funds to process refund.",
        },
      });
    }

    // Process refund
    customer.wallet.balance = mongoose.Types.Decimal128.fromString(
      (customerBalance + amountToRefund).toString()
    );
    businessAccount.wallet.balance = mongoose.Types.Decimal128.fromString(
      (businessBalance - amountToRefund).toString()
    );

    await customer.save({ session });
    await businessAccount.save({ session });

    // Update original transaction status
    originalTransaction.status = "refunded";
    await originalTransaction.save({ session });

    // Create refund transaction record
    const refundTransaction = new Transaction({
      type: "refund",
      from: business._id, // Refund comes from business
      to: customer._id,   // Goes to customer
      amount: amountToRefund,
      paymentMethod: "api",
      merchant: {
        businessId: business._id,
        businessName: business.businessInfo?.businessName || "Unknown Business",
        apiKeyId: apiKey._id,
      },
      description: reason || "Refund",
      status: "completed",
      originalTransaction: originalTransaction._id,
      fromBalanceBefore: businessBalance,
      fromBalanceAfter: businessBalance - amountToRefund,
      toBalanceBefore: customerBalance,
      toBalanceAfter: customerBalance + amountToRefund,
    });

    await refundTransaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      data: {
        refundId: refundTransaction.reference,
        originalTransactionId: transactionId,
        amount: amountToRefund,
        currency: "PHP",
        status: refundTransaction.status,
        reason: reason || "Refund",
        createdAt: refundTransaction.createdAt,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/**
 * Get transaction by reference ID
 * GET /api/public/transactions/:reference
 */
const getTransaction = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const business = req.business;

    const transaction = await Transaction.findOne({
      reference,
      "merchant.businessId": business._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: {
          code: "TRANSACTION_NOT_FOUND",
          message: "Transaction not found.",
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        transactionId: transaction.reference,
        type: transaction.type,
        amount: transaction.amount,
        currency: "PHP",
        status: transaction.status,
        cardLast4: transaction.cardUsed?.last4,
        description: transaction.description,
        externalReference: transaction.externalReference,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all transactions for the business
 * GET /api/public/transactions
 * Query params: page, limit, type, status, startDate, endDate
 */
const getBusinessTransactions = async (req, res, next) => {
  try {
    const business = req.business;
    const {
      page = 1,
      limit = 20,
      type,
      status,
      startDate,
      endDate,
    } = req.query;

    // Build query
    const query = {
      "merchant.businessId": business._id,
    };

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        transactions: transactions.map((t) => ({
          transactionId: t.reference,
          type: t.type,
          amount: t.amount,
          currency: "PHP",
          status: t.status,
          cardLast4: t.cardUsed?.last4,
          description: t.description,
          externalReference: t.externalReference,
          createdAt: t.createdAt,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get business wallet balance
 * GET /api/public/balance
 */
const getBusinessBalance = async (req, res, next) => {
  try {
    const business = req.business;

    const businessAccount = await User.findById(business._id);

    if (!businessAccount) {
      return res.status(404).json({
        success: false,
        error: {
          code: "BUSINESS_NOT_FOUND",
          message: "Business account not found.",
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        balance: parseFloat(businessAccount.wallet.balance.toString()),
        currency: businessAccount.wallet.currency,
        businessName: businessAccount.businessInfo?.businessName,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify a card (check if valid without charging)
 * POST /api/public/cards/verify
 * 
 * Request body:
 * {
 *   cardNumber: "4111111111111111",
 *   cvv: "123"
 * }
 */
const verifyCard = async (req, res, next) => {
  try {
    const { cardNumber, cvv } = req.body;

    // Validate card format
    const cardValidation = validateCardFormat(cardNumber);
    if (!cardValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_CARD_FORMAT",
          message: cardValidation.error,
        },
      });
    }

    // Find card holder
    const customer = await User.findByCardNumber(cardNumber).select("+virtualCard.cvv");

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: {
          code: "CARD_NOT_FOUND",
          message: "Card not found.",
        },
      });
    }

    // Verify CVV
    const cvvValid = await customer.compareCVV(cvv);
    if (!cvvValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_CVV",
          message: "Invalid CVV.",
        },
      });
    }

    // Check card status
    const isExpired = customer.isCardExpired();
    const isActive = customer.virtualCard.isActive;

    res.status(200).json({
      success: true,
      data: {
        valid: isActive && !isExpired,
        cardLast4: cardNumber.slice(-4),
        isActive,
        isExpired,
        expiryDate: customer.virtualCard.expiryDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chargeCard,
  refundTransaction,
  getTransaction,
  getBusinessTransactions,
  getBusinessBalance,
  verifyCard,
};
