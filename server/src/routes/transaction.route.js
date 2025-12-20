const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");

const { auth, checkRole, validateTransaction, validateDeposit, validateWithdraw } = require("../middlewares");

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Get all transactions for authenticated user
router.get("/", auth, transactionController.getUserTransactions);

// Transfer funds between users
router.post("/transfer", auth, validateTransaction, transactionController.transferFunds);

// Deposit funds from bank to user wallet
router.post("/deposit", auth, validateDeposit, transactionController.depositFunds);

// Withdraw funds from user wallet to bank
router.post("/withdraw", auth, validateWithdraw, transactionController.withdrawFunds);

// ============================================
// ADMIN ROUTES (Admin authentication required)
// ============================================

// Get bank status (balance, statistics)
router.get("/bank/status", auth, checkRole("admin"), transactionController.getBankStatus);

module.exports = router;
