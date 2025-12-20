/**
 * CARD GENERATOR UTILITIES
 * ========================
 * Utilities for generating and validating virtual card data
 * - Luhn algorithm for card number generation/validation
 * - CVV generation
 * - Expiry date generation
 * - PIN hashing
 */

const crypto = require("crypto");
const bcrypt = require("bcryptjs");

/**
 * Luhn Algorithm - Validates card numbers
 * Used by major card networks (Visa, MasterCard, etc.)
 * @param {string} cardNumber - The card number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validateLuhn = (cardNumber) => {
  const digits = cardNumber.replace(/\D/g, "");
  
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Generate a Luhn-valid card number
 * Format: 4XXX XXXX XXXX XXXX (16 digits, starts with 4 like Visa)
 * @returns {string} - A valid 16-digit card number
 */
const generateCardNumber = () => {
  // Start with bank identifier (4 = our Smart City Bank)
  const prefix = "4";
  
  // Generate 14 random digits
  let cardNumber = prefix;
  for (let i = 0; i < 14; i++) {
    cardNumber += Math.floor(Math.random() * 10).toString();
  }

  // Calculate Luhn check digit
  const checkDigit = calculateLuhnCheckDigit(cardNumber);
  cardNumber += checkDigit;

  return cardNumber;
};

/**
 * Calculate the Luhn check digit for a partial card number
 * @param {string} partialNumber - Card number without check digit
 * @returns {string} - The check digit
 */
const calculateLuhnCheckDigit = (partialNumber) => {
  const digits = partialNumber.replace(/\D/g, "");
  let sum = 0;
  let isEven = true;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return ((10 - (sum % 10)) % 10).toString();
};

/**
 * Generate a 3-digit CVV
 * @returns {string} - A 3-digit CVV
 */
const generateCVV = () => {
  return crypto.randomInt(100, 999).toString().padStart(3, "0");
};

/**
 * Hash CVV for secure storage
 * @param {string} cvv - Plain text CVV
 * @returns {Promise<string>} - Hashed CVV
 */
const hashCVV = async (cvv) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(cvv, salt);
};

/**
 * Compare CVV with hashed version
 * @param {string} plainCVV - Plain text CVV
 * @param {string} hashedCVV - Hashed CVV
 * @returns {Promise<boolean>} - True if match
 */
const compareCVV = async (plainCVV, hashedCVV) => {
  return bcrypt.compare(plainCVV, hashedCVV);
};

/**
 * Generate a 4-digit PIN
 * @returns {string} - A 4-digit PIN
 */
const generatePIN = () => {
  return crypto.randomInt(1000, 9999).toString().padStart(4, "0");
};

/**
 * Hash PIN for secure storage
 * @param {string} pin - Plain text PIN
 * @returns {Promise<string>} - Hashed PIN
 */
const hashPIN = async (pin) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pin, salt);
};

/**
 * Compare PIN with hashed version
 * @param {string} plainPIN - Plain text PIN
 * @param {string} hashedPIN - Hashed PIN
 * @returns {Promise<boolean>} - True if match
 */
const comparePIN = async (plainPIN, hashedPIN) => {
  return bcrypt.compare(plainPIN, hashedPIN);
};

/**
 * Generate expiry date (3 years from now)
 * @returns {Date} - Expiry date
 */
const generateExpiryDate = () => {
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 3);
  return expiry;
};

/**
 * Check if card is expired
 * @param {Date} expiryDate - Card expiry date
 * @returns {boolean} - True if expired
 */
const isCardExpired = (expiryDate) => {
  return new Date() > new Date(expiryDate);
};

/**
 * Format card number for display (masked)
 * @param {string} cardNumber - Full card number
 * @returns {string} - Masked card number (e.g., **** **** **** 1234)
 */
const maskCardNumber = (cardNumber) => {
  const last4 = cardNumber.slice(-4);
  return `**** **** **** ${last4}`;
};

/**
 * Format card number with spaces for readability
 * @param {string} cardNumber - Card number without spaces
 * @returns {string} - Formatted card number (e.g., 4111 1111 1111 1111)
 */
const formatCardNumber = (cardNumber) => {
  return cardNumber.replace(/(\d{4})/g, "$1 ").trim();
};

/**
 * Generate a secure API key for business accounts
 * Format: scb_live_xxxxxxxxxxxxxxxxxxxx (32 char random string)
 * @param {string} prefix - Key prefix (scb_live_ or scb_test_)
 * @returns {string} - API key
 */
const generateAPIKey = (prefix = "scb_live_") => {
  const randomBytes = crypto.randomBytes(24).toString("hex");
  return `${prefix}${randomBytes}`;
};

/**
 * Hash API key for secure storage
 * @param {string} apiKey - Plain API key
 * @returns {string} - Hashed API key (using SHA256)
 */
const hashAPIKey = (apiKey) => {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
};

/**
 * Validate card number format (basic validation before Luhn)
 * @param {string} cardNumber - Card number to validate
 * @returns {object} - { isValid: boolean, error: string | null }
 */
const validateCardFormat = (cardNumber) => {
  if (!cardNumber) {
    return { isValid: false, error: "Card number is required" };
  }

  const cleaned = cardNumber.replace(/\D/g, "");

  if (cleaned.length !== 16) {
    return { isValid: false, error: "Card number must be 16 digits" };
  }

  if (!cleaned.startsWith("4")) {
    return { isValid: false, error: "Invalid card issuer" };
  }

  if (!validateLuhn(cleaned)) {
    return { isValid: false, error: "Invalid card number" };
  }

  return { isValid: true, error: null };
};

/**
 * Validate CVV format
 * @param {string} cvv - CVV to validate
 * @returns {object} - { isValid: boolean, error: string | null }
 */
const validateCVVFormat = (cvv) => {
  if (!cvv) {
    return { isValid: false, error: "CVV is required" };
  }

  if (!/^\d{3}$/.test(cvv)) {
    return { isValid: false, error: "CVV must be 3 digits" };
  }

  return { isValid: true, error: null };
};

module.exports = {
  // Card number utilities
  validateLuhn,
  generateCardNumber,
  calculateLuhnCheckDigit,
  maskCardNumber,
  formatCardNumber,
  validateCardFormat,

  // CVV utilities
  generateCVV,
  hashCVV,
  compareCVV,
  validateCVVFormat,

  // PIN utilities
  generatePIN,
  hashPIN,
  comparePIN,

  // Expiry utilities
  generateExpiryDate,
  isCardExpired,

  // API Key utilities
  generateAPIKey,
  hashAPIKey,
};
