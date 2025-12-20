const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");

const { auth, validateTransaction } = require("../middlewares");

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Create a new transaction (deposit, withdraw, transfer)
router.post("/", auth, validateTransaction, transactionController.transferFunds);

module.exports = router;
