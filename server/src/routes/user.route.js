const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const userController = require("../controllers/user.controller");

const { auth, checkRole, validateUser, validateRegistration, loginLimiter } = require("../middlewares");

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================
        
// Register new user
router.post("/register", validateRegistration, userController.register);

// Login user (with strict rate limiting to prevent brute force)
router.post("/login", loginLimiter, userController.login);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Get current user profile (any authenticated user)
router.get("/profile", auth, userController.getProfile);

// Get all users (admin only)
router.get("/", auth, checkRole("admin"), userController.getAllUsers);

// Get user by ID (admin only)
router.get("/:id", auth, checkRole("admin"), userController.getUserById);

// Create user (admin only) - with comprehensive validation
router.post("/", auth, checkRole("admin"), validateRegistration, userController.createUser);

// Update user (admin only) - with validation
router.put("/:id", auth, checkRole("admin"), validateUser, userController.updateUser);

// Delete user by ID (admin only)
router.delete("/:id", auth, checkRole("admin"), userController.deleteUser);

// Delete all users (admin only) - dangerous operation
router.delete("/deleteAllUsers", auth, checkRole("admin"), userController.deleteAllUsers);

module.exports = router;
