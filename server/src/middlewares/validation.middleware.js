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


module.exports = {
  validateUser,
  validateRegistration,
  validateTransaction,
};
