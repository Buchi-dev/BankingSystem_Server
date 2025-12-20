/**
 * BUSINESS MIDDLEWARE
 * ===================
 * Restricts access to business-only endpoints
 * Ensures only users with accountType: "business" can access business APIs
 */

const User = require("../models/user.model");

/**
 * Middleware to check if user has a business account
 * Used to prevent personal/customer accounts from accessing business endpoints
 * Note: This fetches the full user from DB since JWT only contains basic info
 */
const requireBusiness = async (req, res, next) => {
  try {
    // Ensure user is authenticated first (JWT decoded should be in req.user)
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Fetch full user document to check accountType
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user has a business account
    if (user.accountType !== "business") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is only accessible to business accounts",
      });
    }

    // Attach full user to request for controller use
    req.userDoc = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if business is verified
 * Used for endpoints that require verified business status
 */
const requireVerifiedBusiness = async (req, res, next) => {
  try {
    // First check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Fetch full user document
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user has a business account
    if (user.accountType !== "business") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is only accessible to business accounts",
      });
    }

    // Check if business is verified
    if (!user.businessInfo?.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Business must be verified to access this resource",
      });
    }

    // Attach full user to request for controller use
    req.userDoc = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireBusiness,
  requireVerifiedBusiness,
};
