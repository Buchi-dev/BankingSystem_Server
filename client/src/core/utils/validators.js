/**
 * Validate SMU email address
 * @param {string} email - Email address to validate
 * @returns {object} Validation result with isValid and error properties
 */
export const validateEmail = (email) => {
  const smuEmailRegex = /^[\w.-]+@smu\.edu\.ph$/i;
  const isValid = smuEmailRegex.test(email);
  
  return {
    isValid,
    error: !isValid ? 'Email must be from @smu.edu.ph domain' : null
  };
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and error properties
 */
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const isValid = 
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumber &&
    hasSpecialChar;
  
  let error = null;
  if (!isValid) {
    if (password.length < minLength) {
      error = `Password must be at least ${minLength} characters long`;
    } else if (!hasUpperCase) {
      error = 'Password must contain at least one uppercase letter';
    } else if (!hasLowerCase) {
      error = 'Password must contain at least one lowercase letter';
    } else if (!hasNumber) {
      error = 'Password must contain at least one number';
    } else if (!hasSpecialChar) {
      error = 'Password must contain at least one special character';
    }
  }
  
  return { isValid, error };
};

/**
 * Validate card number (must be 16 digits starting with 4532)
 * @param {string} cardNumber - Card number to validate
 * @returns {object} Validation result with isValid and error properties
 */
export const validateCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  const isValid = /^\d{16}$/.test(cleaned) && cleaned.startsWith('4532');
  
  return {
    isValid,
    error: !isValid ? 'Invalid card number format (must be 16 digits starting with 4532)' : null
  };
};

/**
 * Validate CVV (must be 3 digits)
 * @param {string} cvv - CVV to validate
 * @returns {object} Validation result with isValid and error properties
 */
export const validateCVV = (cvv) => {
  const isValid = /^\d{3}$/.test(cvv);
  
  return {
    isValid,
    error: !isValid ? 'CVV must be 3 digits' : null
  };
};

/**
 * Validate PIN (must be 4 digits)
 * @param {string} pin - PIN to validate
 * @returns {object} Validation result with isValid and error properties
 */
export const validatePIN = (pin) => {
  const isValid = /^\d{4}$/.test(pin);
  
  return {
    isValid,
    error: !isValid ? 'PIN must be 4 digits' : null
  };
};

/**
 * Validate amount (must be positive number within range)
 * @param {number|string} amount - Amount to validate
 * @param {number} min - Minimum allowed amount (default: 1)
 * @param {number} max - Maximum allowed amount (default: Infinity)
 * @returns {object} Validation result with isValid and error properties
 */
export const validateAmount = (amount, min = 1, max = Infinity) => {
  const numAmount = parseFloat(amount);
  const isValid = !isNaN(numAmount) && numAmount >= min && numAmount <= max && numAmount > 0;
  
  let error = null;
  if (!isValid) {
    if (isNaN(numAmount)) {
      error = 'Please enter a valid number';
    } else if (numAmount <= 0) {
      error = 'Amount must be greater than 0';
    } else if (numAmount < min) {
      error = `Amount must be at least ₱${min.toFixed(2)}`;
    } else if (numAmount > max) {
      error = `Amount cannot exceed ₱${max.toFixed(2)}`;
    }
  }
  
  return { isValid, error };
};

/**
 * Validate full name
 * @param {object} fullName - Full name object with firstName, lastName, middleInitial
 * @returns {object} Validation result with isValid and error properties
 */
export const validateFullName = (fullName) => {
  const { firstName, lastName, middleInitial } = fullName;
  
  if (!firstName || firstName.length < 2 || firstName.length > 30) {
    return {
      isValid: false,
      error: 'First name must be between 2 and 30 characters'
    };
  }
  
  if (!lastName || lastName.length < 2 || lastName.length > 30) {
    return {
      isValid: false,
      error: 'Last name must be between 2 and 30 characters'
    };
  }
  
  if (middleInitial && !/^[A-Z]$/.test(middleInitial)) {
    return {
      isValid: false,
      error: 'Middle initial must be a single uppercase letter'
    };
  }
  
  const nameRegex = /^[a-zA-Z\s]+$/;
  if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
    return {
      isValid: false,
      error: 'Names can only contain letters and spaces'
    };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate phone number (Philippine format)
 * @param {string} phone - Phone number to validate
 * @returns {object} Validation result with isValid and error properties
 */
export const validatePhoneNumber = (phone) => {
  const phoneRegex = /^(09|\+639)\d{9}$/;
  const isValid = phoneRegex.test(phone.replace(/[\s-]/g, ''));
  
  return {
    isValid,
    error: !isValid ? 'Invalid Philippine phone number format' : null
  };
};

/**
 * Validate business type
 * @param {string} type - Business type to validate
 * @returns {object} Validation result with isValid and error properties
 */
export const validateBusinessType = (type) => {
  const validTypes = ['food', 'retail', 'services', 'transport', 'utilities', 'other'];
  const isValid = validTypes.includes(type);
  
  return {
    isValid,
    error: !isValid ? `Business type must be one of: ${validTypes.join(', ')}` : null
  };
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {object} Validation result with isValid and error properties
 */
export const validateURL = (url) => {
  try {
    new URL(url);
    const isValid = url.startsWith('http://') || url.startsWith('https://');
    return {
      isValid,
      error: !isValid ? 'URL must start with http:// or https://' : null
    };
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format'
    };
  }
};
