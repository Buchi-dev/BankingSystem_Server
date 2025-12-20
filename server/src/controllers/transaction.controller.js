const mongoose = require("mongoose");
const Transaction = require("../models/transaction.model");
const User = require("../models/user.model");
const Bank = require("../models/bank.model");

/**
 * TRANSACTION CONTROLLERS
 */

// Get all transactions for a user
const getUserTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Find all transactions where user is involved (as user, sender, or recipient)
    const transactions = await Transaction.find({
      $or: [
        { user: userId },
        { from: userId },
        { to: userId },
      ],
    })
      .populate("user", "fullName email")
      .populate("from", "fullName email")
      .populate("to", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};
// Transfer funds between users
const transferFunds = async (req, res, next) => {
    const { to, amount } = req.body;
    const from = req.user.id; // Extract from JWT token

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const fromUser = await User.findById(from).session(session);
        const toUser = await User.findById(to).session(session);

        if (!fromUser || !toUser) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                success: false,
                message: "Sender or recipient not found",
            });
        }

        const fromBalance = parseFloat(fromUser.wallet.balance.toString());
        const toBalance = parseFloat(toUser.wallet.balance.toString());
        const transferAmount = parseFloat(amount);

        if (fromBalance < transferAmount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "Insufficient funds",
            });
        }

        fromUser.wallet.balance = mongoose.Types.Decimal128.fromString((fromBalance - transferAmount).toString());
        toUser.wallet.balance = mongoose.Types.Decimal128.fromString((toBalance + transferAmount).toString());

        await fromUser.save({ session });
        await toUser.save({ session });

        const transaction = new Transaction({
            type: "transfer",
            from,
            to,
            amount: transferAmount,
            fromBalanceBefore: fromBalance,
            fromBalanceAfter: fromBalance - transferAmount,
            toBalanceBefore: toBalance,
            toBalanceAfter: toBalance + transferAmount,
            // reference auto-generated
        });

        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: "Funds transferred successfully",
            transaction,
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};
// Deposit Funds From Bank balance
const depositFunds = async (req, res, next) => {
  const { amount } = req.body;
  const userId = req.user.id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Fetch user and bank with session
    const user = await User.findById(userId).session(session);
    const bank = await Bank.findOne().session(session);

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!bank) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Bank not found",
      });
    }

    // Convert Decimal128 to float for calculations
    const userBalance = parseFloat(user.wallet.balance.toString());
    const bankBalance = parseFloat(bank.bankBalance.toString());
    const depositAmount = parseFloat(amount);

    // Check if bank has sufficient funds
    if (bankBalance < depositAmount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Bank has insufficient funds",
      });
    }

    // Update balances
    user.wallet.balance = mongoose.Types.Decimal128.fromString(
      (userBalance + depositAmount).toString()
    );
    bank.bankBalance = mongoose.Types.Decimal128.fromString(
      (bankBalance - depositAmount).toString()
    );
    bank.lastUpdated = Date.now();

    await user.save({ session });
    await bank.save({ session });

    // Create transaction record
    const transaction = new Transaction({
      type: "deposit",
      user: userId,
      amount: depositAmount,
      balanceBefore: userBalance,
      balanceAfter: userBalance + depositAmount,
    });

    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Funds deposited successfully",
      transaction,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
}

const withdrawFunds = async (req, res, next) => {
  const { amount } = req.body;
  const userId = req.user.id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Fetch user and bank with session
    const user = await User.findById(userId).session(session);
    const bank = await Bank.findOne().session(session);

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!bank) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Bank not found",
      });
    }

    // Convert Decimal128 to float for calculations
    const userBalance = parseFloat(user.wallet.balance.toString());
    const bankBalance = parseFloat(bank.bankBalance.toString());
    const withdrawAmount = parseFloat(amount);

    // Check if user has sufficient funds
    if (userBalance < withdrawAmount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Insufficient funds",
      });
    }

    // Update balances
    user.wallet.balance = mongoose.Types.Decimal128.fromString(
      (userBalance - withdrawAmount).toString()
    );
    bank.bankBalance = mongoose.Types.Decimal128.fromString(
      (bankBalance + withdrawAmount).toString()
    );
    bank.lastUpdated = Date.now();

    await user.save({ session });
    await bank.save({ session });

    // Create transaction record
    const transaction = new Transaction({
      type: "withdraw",
      user: userId,
      amount: withdrawAmount,
      balanceBefore: userBalance,
      balanceAfter: userBalance - withdrawAmount,
    });

    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Funds withdrawn successfully",
      transaction,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
}

module.exports = {
  getUserTransactions,
  transferFunds,
  depositFunds,
  withdrawFunds,
};
