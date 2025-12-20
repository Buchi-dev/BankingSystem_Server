const mongoose = require("mongoose");
const Transaction = require("../models/transaction.model");
const User = require("../models/user.model");
const Bank = require("../models/bank.model");

/**
 * TRANSACTION CONTROLLERS
 */

// Get all transactions for a user
const getUserTransactions = async (req, res, next) => {

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

}

const withdrawFunds = async (req, res, next) => {

}

module.exports = {
  getUserTransactions,
  transferFunds,
  depositFunds,
  withdrawFunds,
};
