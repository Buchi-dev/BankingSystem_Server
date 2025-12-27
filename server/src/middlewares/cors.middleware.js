/**
 * DYNAMIC CORS MIDDLEWARE
 * =======================
 * Handles CORS for both internal and public API routes
 * 
 * Internal routes (/api/users, /api/transactions, /api/business):
 *   - Uses standard permissive CORS for the frontend application
 * 
 * Public API routes (/api/public/*):
 *   - Validates Origin header against API key's allowedOrigins
 *   - Supports wildcard patterns (e.g., https://*.example.com)
 *   - Blocks requests from non-whitelisted origins
 */

const APIKey = require("../models/apiKey.model");

/**
 * Match origin against pattern with wildcard support
 * @param {string} origin - Request origin (e.g., 'https://app.example.com')
 * @param {string} pattern - Allowed pattern (e.g., 'https://*.example.com')
 * @returns {boolean}
 */
const matchOriginPattern = (origin, pattern) => {
  if (!origin || !pattern) return false;

  // Exact match
  if (origin === pattern) return true;

  // Wildcard pattern: https://*.example.com
  // Only allow wildcards at the subdomain level (beginning of domain)
  if (pattern.includes("*.")) {
    // Check if wildcard is at the start of the domain part (after protocol)
    const protocolMatch = pattern.match(/^(https?:\/\/)/);
    if (!protocolMatch) return false;
    
    const afterProtocol = pattern.substring(protocolMatch[0].length);
    // Wildcard must be at the start of the domain, not in the middle
    if (!afterProtocol.startsWith("*.")) return false;
    
    // Escape regex special chars except *, then convert * to subdomain regex
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // Escape regex chars
      .replace(/\*/g, "[a-zA-Z0-9_-]+"); // * matches subdomain with alphanumeric, underscore, or hyphen

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(origin);
  }

  return false;
};

/**
 * Get allowed origin for the request
 * For public API routes, validates against API key's allowedOrigins
 * For internal routes, allows the requesting origin
 * 
 * @param {string} origin - Request origin header
 * @param {string} path - Request path
 * @param {string} apiKeyHeader - X-API-Key header value
 * @returns {Promise<{allowed: boolean, origin: string|null, error?: string}>}
 */
const getAllowedOrigin = async (origin, path, apiKeyHeader) => {
  // For non-public routes, allow standard CORS
  if (!path.startsWith("/api/public")) {
    return { allowed: true, origin: origin || "*" };
  }

  // For public routes, we need to validate against API key origins
  // If no origin header (server-to-server request), allow but track
  if (!origin) {
    return { allowed: true, origin: null, serverToServer: true };
  }

  // If no API key provided, let the apiAuth middleware handle the error
  if (!apiKeyHeader) {
    return { allowed: true, origin: null };
  }

  // Validate API key format
  if (!apiKeyHeader.startsWith("scb_")) {
    return { allowed: false, origin: null, error: "INVALID_API_KEY_FORMAT" };
  }

  try {
    // Find the API key
    const keyDocument = await APIKey.findByKey(apiKeyHeader);

    if (!keyDocument) {
      // Let apiAuth middleware handle invalid key
      return { allowed: true, origin: null };
    }

    // Check if origin is allowed for this key
    if (keyDocument.isOriginAllowed(origin)) {
      return { allowed: true, origin: origin };
    }

    // Origin not allowed
    return {
      allowed: false,
      origin: null,
      error: "ORIGIN_NOT_ALLOWED",
      message: `Origin '${origin}' is not in the allowed origins list for this API key.`,
    };
  } catch (error) {
    console.error("CORS Middleware Error:", error);
    return { allowed: false, origin: null, error: "CORS_VALIDATION_ERROR" };
  }
};

/**
 * Dynamic CORS Middleware
 * Handles CORS preflight and actual requests
 */
const dynamicCors = async (req, res, next) => {
  const origin = req.headers.origin;
  const path = req.path;
  const apiKey = req.headers["x-api-key"];

  // Set common CORS headers
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-API-Key, X-Requested-With"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    // For preflight, we need to check if the origin would be allowed
    const result = await getAllowedOrigin(origin, path, apiKey);

    if (result.allowed && result.origin) {
      res.setHeader("Access-Control-Allow-Origin", result.origin);
    } else if (!path.startsWith("/api/public")) {
      // For non-public routes, allow the origin
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
    } else if (result.allowed && !result.origin) {
      // Server-to-server or missing API key - allow preflight but actual request will be validated
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
    }

    return res.status(204).end();
  }

  // Handle actual request
  const result = await getAllowedOrigin(origin, path, apiKey);

  if (!result.allowed) {
    // Block the request with CORS error
    return res.status(403).json({
      success: false,
      error: {
        code: result.error,
        message: result.message || "Origin not allowed by CORS policy.",
      },
    });
  }

  // Set the allowed origin
  if (result.origin) {
    res.setHeader("Access-Control-Allow-Origin", result.origin);
  } else if (!path.startsWith("/api/public")) {
    // For internal routes, allow requesting origin
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  } else if (result.serverToServer) {
    // Server-to-server request (no Origin header) - don't set CORS header
    // This is fine because browsers always send Origin header
  }

  // Expose custom headers to the client
  res.setHeader("Access-Control-Expose-Headers", "X-RateLimit-Limit, X-RateLimit-Remaining");

  next();
};

/**
 * Simple CORS middleware for internal routes only
 * More permissive for the admin dashboard / internal frontend
 */
const internalCors = (allowedOrigins = []) => {
  return (req, res, next) => {
    const origin = req.headers.origin;

    // If no specific origins configured, allow all
    if (allowedOrigins.length === 0) {
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
    } else if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    next();
  };
};

module.exports = {
  dynamicCors,
  internalCors,
  matchOriginPattern,
};
