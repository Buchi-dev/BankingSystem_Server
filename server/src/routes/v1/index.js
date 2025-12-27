/**
 * API VERSION 1 ROUTES INDEX
 * ==========================
 * Central router for all v1 API routes
 * This file aggregates all route modules for API version 1
 */

const express = require("express");
const router = express.Router();

// Import route modules
const userRoutes = require("../user.route");
const transactionRoutes = require("../transaction.route");
const businessRoutes = require("../business.route");
const publicTransactionRoutes = require("../public.transaction.route");
const employeeRoutes = require("../employee.route");

// Mount routes
router.use("/users", userRoutes);
router.use("/transactions", transactionRoutes);
router.use("/business", businessRoutes);
router.use("/public", publicTransactionRoutes);
router.use("/employees", employeeRoutes);

module.exports = router;
