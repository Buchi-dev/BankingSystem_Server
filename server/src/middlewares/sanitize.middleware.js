/**
 * SANITIZE MIDDLEWARE
 * ===================
 * Prevents XSS attacks by sanitizing all string inputs
 * Strips dangerous HTML tags and scripts from req.body, req.query, req.params
 */

const sanitizeHtml = require("sanitize-html");

// Strict sanitization options - strip ALL HTML tags
const sanitizeOptions = {
  allowedTags: [], // No HTML tags allowed
  allowedAttributes: {}, // No attributes allowed
  disallowedTagsMode: "discard", // Remove tags entirely
};

/**
 * Recursively sanitize all string values in an object
 * @param {any} obj - The object to sanitize
 * @returns {any} - The sanitized object
 */
const sanitizeValue = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle strings - sanitize them
  if (typeof obj === "string") {
    return sanitizeHtml(obj, sanitizeOptions).trim();
  }

  // Handle arrays - sanitize each element
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeValue(item));
  }

  // Handle objects - sanitize each property
  if (typeof obj === "object") {
    const sanitized = {};
    for (const key of Object.keys(obj)) {
      // Also sanitize the key itself (prevent XSS in object keys)
      const sanitizedKey = sanitizeHtml(key, sanitizeOptions);
      sanitized[sanitizedKey] = sanitizeValue(obj[key]);
    }
    return sanitized;
  }

  // Return other types (numbers, booleans) as-is
  return obj;
};

/**
 * Express middleware to sanitize all incoming data
 */
const sanitize = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === "object") {
      req.body = sanitizeValue(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === "object") {
      req.query = sanitizeValue(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === "object") {
      req.params = sanitizeValue(req.params);
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = sanitize;
