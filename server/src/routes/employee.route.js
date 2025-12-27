const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const employeeController = require("../controllers/employee.controller");

const { auth, checkRole, validateEmployeeRegistration, employeeLoginLimiter } = require("../middlewares");

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Employee login (with rate limiting)
router.post("/login", employeeLoginLimiter, employeeController.employeeLogin);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Register new employee (admin/staff only)
router.post("/register", auth, checkRole(["admin", "staff"]), validateEmployeeRegistration, employeeController.registerEmployee);

// Get all employees (admin/staff only)
router.get("/", auth, checkRole(["admin", "staff"]), employeeController.getAllEmployees);

// Get employee by ID (admin/staff only)
router.get("/:id", auth, checkRole(["admin", "staff"]), employeeController.getEmployeeById);

// Update employee (admin/staff only)
router.put("/:id", auth, checkRole(["admin", "staff"]), employeeController.updateEmployee);

// Delete employee (admin/staff only)
router.delete("/:id", auth, checkRole(["admin", "staff"]), employeeController.deleteEmployee);

// Verify employee account (admin/staff only)
router.patch("/:id/verify", auth, checkRole(["admin", "staff"]), employeeController.verifyEmployee);

module.exports = router;