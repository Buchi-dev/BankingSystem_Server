const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const { formatCardNumber, maskCardNumber } = require("../utils/cardGenerator");

/**
 * AUTHENTICATION CONTROLLERS
 */

// Register new user (supports both personal and business accounts)
const register = async (req, res, next) => {
  try {
    // SECURITY: Only whitelist allowed fields - role is NOT accepted from user input
    const {
      fullName = {},
      email,
      password,
      accountType = "personal", // Default to personal for backward compatibility
      businessInfo = {},
    } = req.body;

    const { firstName, lastName, middleInitial } = fullName;

    // Validate accountType
    if (accountType && !["personal", "business"].includes(accountType)) {
      return res.status(400).json({
        success: false,
        message: "Account type must be either 'personal' or 'business'",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Prepare user data based on account type
    const userData = {
      fullName: { firstName, lastName, middleInitial },
      email,
      password,
      role: "user", // SECURITY: Hardcoded - prevents mass assignment attack
      accountType: accountType || "personal",
    };

    // Only populate businessInfo for business accounts (data pollution prevention)
    if (accountType === "business") {
      const { businessName, businessType, businessAddress, businessPhone, websiteUrl } = businessInfo;
      
      userData.businessInfo = {
        businessName,
        businessType,
        businessAddress,
        businessPhone,
        websiteUrl,
        isVerified: false, // Requires admin verification
      };
    }
    // For personal accounts, businessInfo should not be set (model will clean it up if accidentally provided)

    // Create new user (password will be hashed automatically by model middleware)
    // Virtual card is auto-generated for personal accounts only
    // SECURITY: Role is always 'user' for new registrations - admin roles must be assigned manually
    const user = await User.create(userData);

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, accountType: user.accountType },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    // Build response based on account type
    const responseData = {
      user: {
        id: user._id,
        firstName: user.fullName.firstName,
        lastName: user.fullName.lastName,
        middleInitial: user.fullName.middleInitial,
        email: user.email,
        role: user.role,
        accountType: user.accountType,
      },
      token,
    };

    // Include virtual card details for personal accounts (CVV and PIN shown only at registration!)
    if (user.accountType === "personal" && user.virtualCard?.cardNumber) {
      responseData.virtualCard = {
        cardNumber: formatCardNumber(user.virtualCard.cardNumber),
        cvv: user._plainCVV, // Only shown once at registration
        pin: user._plainPIN, // Only shown once at registration
        expiryDate: user.virtualCard.expiryDate,
        message: "IMPORTANT: Save your CVV and PIN securely. They will NOT be shown again!",
      };
    }

    // Include business info for business accounts
    if (user.accountType === "business" && user.businessInfo) {
      responseData.user.businessInfo = {
        businessName: user.businessInfo.businessName,
        businessType: user.businessInfo.businessType,
        websiteUrl: user.businessInfo.websiteUrl,
        isVerified: user.businessInfo.isVerified,
      };
    }

    // Set appropriate success message
    const successMessage = user.accountType === "business"
      ? "Business account registered successfully. Awaiting verification."
      : "User registered successfully";

    res.status(201).json({
      success: true,
      message: successMessage,
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          firstName: user.fullName.firstName,
          lastName: user.fullName.lastName,
          email: user.email,
          role: user.role,
          accountType: user.accountType,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
const getProfile = async (req, res, next) => {
  try {
    // req.user is set by auth middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * USER CRUD CONTROLLERS
 */

const getAllUsers = async (req, res, next) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100",
      });
    }

    // Get total count for pagination metadata
    const totalCount = await User.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch users with pagination
    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};
const createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
const getUserById = async (req, res, next) => {
  try {
    const users = await User.findById(req.params.id);
    if (!users)
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};
const deleteUser = async (req, res, next) => {
  try {
    // Prevent admins from deleting their own account
    if (req.user.id === req.params.id) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete your own profile",
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res
      .status(200)
      .json({ success: true, message: "User deleted", data: user });
  } catch (error) {
    next(error);
  }
};
const deleteAllUsers = async (req, res, next) => {
  try {
    // Require explicit confirmation to prevent accidental deletion
    if (req.query.confirm !== 'true') {
      return res.status(400).json({
        success: false,
        message: "This is a dangerous operation. Add ?confirm=true to the query string to proceed.",
      });
    }

    const result = await User.deleteMany({});
    res
      .status(200)
      .json({ success: true, message: `${result.deletedCount} users deleted` });
  } catch (error) {
    next(error);
  }
};
const updateUser = async (req, res, next) => {
  try {
    // Prevent users from updating their own role (security measure)
    if (req.body.role && req.user.id === req.params.id)
      return res.status(403).json({
        success: false,
        message: "You cannot change your own role",
      });

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Auth controllers
  register,
  login,
  getProfile,
  // User CRUD controllers
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserById,
  deleteAllUsers,
};
