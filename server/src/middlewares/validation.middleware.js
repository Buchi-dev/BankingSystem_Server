const validateUser = (req, res, next) => {
  const { firstName, lastName, email, age, gender, middleInitial } = req.body;

  if (!firstName || !lastName || !email || !age || !gender)
    return res
      .status(400)
      .json({ success: false, message: "Some Fields are Missing" });

  const nameRegex = /^[A-Za-z ]+$/; // allows letters and spaces
  const initialRegex = /^[A-Za-z]+$/;

  if (
    !nameRegex.test(firstName) ||
    !nameRegex.test(lastName) ||
    (middleInitial && !initialRegex.test(middleInitial))
  )
    return res
      .status(400)
      .json({
        success: false,
        message: "Names must contain only letters and spaces",
      });

  const emailRegex = /^[\w.-]+@smu\.edu\.ph$/;
  if (!emailRegex.test(email))
    return res
      .status(400)
      .json({ success: false, message: "Only smu.edu.ph Emails Onlys" });

  if (age < 1 || age > 500)
    return res
      .status(400)
      .json({ success: false, message: "Age Must Be Between 1 and 500" });

  const allowedGenders = ["male", "female", "rather not say"];
  if (!allowedGenders.includes(gender))
    return res
      .status(400)
      .json({ success: false, message: "Gender is Invalid" });

  next();
};

// Validation for registration (includes password)
const validateRegistration = (req, res, next) => {
  const {
    fullName = {},
    email,
    password,
  } = req.body;

  const { firstName, lastName, middleInitial } = fullName;

  // Required fields
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "First name, last name, email, and password are required",
    });
  }

  // Password strength
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long",
    });
  }

  // Name validation
  const nameRegex = /^[A-Za-z ]+$/;
  const initialRegex = /^[A-Za-z]+$/;

  if (
    !nameRegex.test(firstName) ||
    !nameRegex.test(lastName) ||
    (middleInitial && !initialRegex.test(middleInitial))
  ) {
    return res.status(400).json({
      success: false,
      message: "Names must contain only letters",
    });
  }

  // Email validation
  const emailRegex = /^[\w.-]+@smu\.edu\.ph$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Only smu.edu.ph email addresses are allowed",
    });
  }

  next();
};

const validateTransaction = (req, res, next) => {
const { to, amount } = req.body;

    if (!to || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: "To and amount are required",
      });
    }

    // Check if user is trying to transfer to themselves (req.user set by auth middleware)
    if (req.user && req.user.id === to) {
      return res.status(400).json({
        success: false,
        message: "Cannot transfer to the same account",
      });
    } 
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero",
      });
    }
    next();
};

const validateDeposit = (req, res, next) => {
  const { amount } = req.body;

  if (amount === undefined || amount === null) {
    return res.status(400).json({
      success: false,
      message: "Amount is required",
    });
  }

  if (amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Amount must be greater than zero",
    });
  }

  next();
};

const validateWithdraw = (req, res, next) => {
  const { amount } = req.body;

  if (amount === undefined || amount === null) {
    return res.status(400).json({
      success: false,
      message: "Amount is required",
    });
  }

  if (amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Amount must be greater than zero",
    });
  }

  next();
};

// ============================================
// PUBLIC API VALIDATION (for external systems)
// ============================================

const { validateCardFormat, validateCVVFormat } = require("../utils/cardGenerator");

/**
 * Validate card charge request from external API
 */
const validateCardCharge = (req, res, next) => {
  const { cardNumber, cvv, amount, description } = req.body;

  // Validate card number
  if (!cardNumber) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_CARD_NUMBER",
        message: "Card number is required",
      },
    });
  }

  const cardValidation = validateCardFormat(cardNumber);
  if (!cardValidation.isValid) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_CARD_NUMBER",
        message: cardValidation.error,
      },
    });
  }

  // Validate CVV
  if (!cvv) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_CVV",
        message: "CVV is required",
      },
    });
  }

  const cvvValidation = validateCVVFormat(cvv);
  if (!cvvValidation.isValid) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_CVV",
        message: cvvValidation.error,
      },
    });
  }

  // Validate amount
  if (amount === undefined || amount === null) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_AMOUNT",
        message: "Amount is required",
      },
    });
  }

  if (typeof amount !== "number" || isNaN(amount)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_AMOUNT",
        message: "Amount must be a valid number",
      },
    });
  }

  if (amount <= 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_AMOUNT",
        message: "Amount must be greater than zero",
      },
    });
  }

  if (amount > 1000000) {
    return res.status(400).json({
      success: false,
      error: {
        code: "AMOUNT_TOO_LARGE",
        message: "Amount exceeds maximum allowed (1,000,000 PHP)",
      },
    });
  }

  // Validate description (optional but has limits)
  if (description && description.length > 200) {
    return res.status(400).json({
      success: false,
      error: {
        code: "DESCRIPTION_TOO_LONG",
        message: "Description must not exceed 200 characters",
      },
    });
  }

  next();
};

/**
 * Validate refund request from external API
 */
const validateRefund = (req, res, next) => {
  const { transactionId, amount, reason } = req.body;

  // Validate transaction ID
  if (!transactionId) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_TRANSACTION_ID",
        message: "Transaction ID is required",
      },
    });
  }

  if (typeof transactionId !== "string" || transactionId.length < 10) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_TRANSACTION_ID",
        message: "Invalid transaction ID format",
      },
    });
  }

  // Validate amount (optional for partial refunds)
  if (amount !== undefined) {
    if (typeof amount !== "number" || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_AMOUNT",
          message: "Refund amount must be a valid number",
        },
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_AMOUNT",
          message: "Refund amount must be greater than zero",
        },
      });
    }
  }

  // Validate reason (optional but has limits)
  if (reason && reason.length > 200) {
    return res.status(400).json({
      success: false,
      error: {
        code: "REASON_TOO_LONG",
        message: "Refund reason must not exceed 200 characters",
      },
    });
  }

  next();
};

/**
 * Validate business registration
 */
const validateBusinessRegistration = (req, res, next) => {
  const {
    fullName = {},
    email,
    password,
    accountType,
    businessInfo = {},
  } = req.body;

  const { firstName, lastName, middleInitial } = fullName;
  const { businessName, businessType, businessAddress, businessPhone } = businessInfo;

  // Required user fields
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "First name, last name, email, and password are required",
    });
  }

  // Password strength
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long",
    });
  }

  // Name validation
  const nameRegex = /^[A-Za-z ]+$/;
  const initialRegex = /^[A-Za-z]+$/;

  if (
    !nameRegex.test(firstName) ||
    !nameRegex.test(lastName) ||
    (middleInitial && !initialRegex.test(middleInitial))
  ) {
    return res.status(400).json({
      success: false,
      message: "Names must contain only letters",
    });
  }

  // Email validation
  const emailRegex = /^[\w.-]+@smu\.edu\.ph$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Only smu.edu.ph email addresses are allowed",
    });
  }

  // Business-specific validation
  if (accountType === "business") {
    if (!businessName) {
      return res.status(400).json({
        success: false,
        message: "Business name is required for business accounts",
      });
    }

    if (businessName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Business name must not exceed 100 characters",
      });
    }

    if (!businessType) {
      return res.status(400).json({
        success: false,
        message: "Business type is required for business accounts",
      });
    }

    const validBusinessTypes = ["food", "retail", "services", "transport", "utilities", "other"];
    if (!validBusinessTypes.includes(businessType)) {
      return res.status(400).json({
        success: false,
        message: `Business type must be one of: ${validBusinessTypes.join(", ")}`,
      });
    }

    // Phone validation (optional but must be valid if provided)
    if (businessPhone) {
      const phoneRegex = /^(\+63|0)?[0-9]{10}$/;
      if (!phoneRegex.test(businessPhone)) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number format",
        });
      }
    }
  }

  next();
};


module.exports = {
  validateUser,
  validateRegistration,
  validateTransaction,
  validateDeposit,
  validateWithdraw,
  validateCardCharge,
  validateRefund,
  validateBusinessRegistration,
};
