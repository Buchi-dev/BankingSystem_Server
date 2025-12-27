const Employee = require("../models/employee.model");
const jwt = require("jsonwebtoken");

/**
 * EMPLOYEE AUTHENTICATION CONTROLLERS
 */

// Register new employee (only admins/staff can create employees)
const registerEmployee = async (req, res, next) => {
  try {
    const {
      fullName = {},
      email,
      password,
      role = "staff",
    } = req.body;

    const { firstName, lastName, middleInitial } = fullName;

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: "Employee with this email already exists",
      });
    }

    // Validate role
    if (role && !["staff", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be either 'staff' or 'admin'",
      });
    }

    // Prepare employee data
    const employeeData = {
      fullName: { firstName, lastName, middleInitial },
      email,
      password,
      role: role || "staff",
      createdBy: req.user.id, // From auth middleware
    };

    // Create new employee
    const employee = await Employee.create(employeeData);

    res.status(201).json({
      success: true,
      message: "Employee registered successfully",
      data: {
        employee: {
          id: employee._id,
          firstName: employee.fullName.firstName,
          lastName: employee.fullName.lastName,
          middleInitial: employee.fullName.middleInitial,
          email: employee.email,
          role: employee.role,
          isVerified: employee.isVerified,
          createdAt: employee.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Employee login
const employeeLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find employee and include password field
    const employee = await Employee.findOne({ email }).select("+password");
    if (!employee) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if employee is verified
    if (!employee.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Account not verified. Please contact administrator.",
      });
    }

    // Check password
    const isPasswordValid = await employee.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: employee._id,
        email: employee.email,
        role: employee.role,
        type: "employee", // To distinguish from regular users
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Employee login successful",
      data: {
        employee: {
          id: employee._id,
          firstName: employee.fullName.firstName,
          lastName: employee.fullName.lastName,
          middleInitial: employee.fullName.middleInitial,
          email: employee.email,
          role: employee.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * EMPLOYEE MANAGEMENT CONTROLLERS (Admin/Staff only)
 */

// Get all employees
const getAllEmployees = async (req, res, next) => {
  try {
    const employees = await Employee.find()
      .populate('createdBy', 'fullName email')
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
      data: {
        employees: employees.map((emp) => ({
          id: emp._id,
          firstName: emp.fullName.firstName,
          lastName: emp.fullName.lastName,
          middleInitial: emp.fullName.middleInitial,
          email: emp.email,
          role: emp.role,
          createdAt: emp.createdAt,
          createdBy: emp.createdBy,
        })),
        count: employees.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get employee by ID
const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id)
      .populate('createdBy', 'fullName email')
      .select('-password');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee retrieved successfully",
      data: {
        employee: {
          id: employee._id,
          firstName: employee.fullName.firstName,
          lastName: employee.fullName.lastName,
          middleInitial: employee.fullName.middleInitial,
          email: employee.email,
          role: employee.role,
          createdAt: employee.createdAt,
          createdBy: employee.createdBy,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update employee
const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated directly
    delete updates.password;
    delete updates.email; // Email changes might need special handling

    const employee = await Employee.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'fullName email')
     .select('-password');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

// Delete employee
const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Verify employee account
const verifyEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByIdAndUpdate(
      id,
      { isVerified: true },
      { new: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee verified successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerEmployee,
  employeeLogin,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  verifyEmployee,
};