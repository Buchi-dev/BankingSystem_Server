/**
 * MONGO SANITIZE MIDDLEWARE
 * =========================
 * Custom MongoDB injection prevention middleware (Express 5.x compatible)
 * Removes dangerous characters ($, .) from request data
 */

// Recursively sanitize data objects
const sanitizeData = (data) => {
  if (typeof data !== 'object' || data === null) return data;
  
  const sanitized = Array.isArray(data) ? [] : {};
  
  for (const key in data) {
    // Remove keys that start with $ or contain .
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    
    const value = data[key];
    
    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Middleware to sanitize request body and params
const mongoSanitize = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeData(req.body);
  }
  if (req.params) {
    req.params = sanitizeData(req.params);
  }
  next();
};

module.exports = mongoSanitize;
