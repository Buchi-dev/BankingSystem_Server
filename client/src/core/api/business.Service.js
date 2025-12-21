import axiosInstance from '../utils/axiosInstance';
import { ENDPOINTS } from '../config/api.config';

/**
 * Business Service - Handles all business account and API key management
 */
export const businessService = {
  /**
   * Register a new business account
   * @param {object} businessData - Business registration data
   * @param {object} businessData.fullName - Full name object
   * @param {string} businessData.email - Email address
   * @param {string} businessData.password - Password
   * @param {object} businessData.businessInfo - Business information
   * @param {string} businessData.businessInfo.businessName - Business name
   * @param {string} businessData.businessInfo.businessType - Business type (food|retail|services|transport|utilities|other)
   * @param {string} businessData.businessInfo.businessAddress - Business address
   * @param {string} businessData.businessInfo.businessPhone - Business phone number
   * @param {string} businessData.businessInfo.websiteUrl - Website URL (required for CORS)
   * @returns {Promise<object>} Registration response with user and token
   */
  registerBusiness: async (businessData) => {
    return await axiosInstance.post(ENDPOINTS.BUSINESS.REGISTER, businessData);
  },

  /**
   * Get business profile
   * @returns {Promise<object>} Business profile data
   */
  getProfile: async () => {
    return await axiosInstance.get(ENDPOINTS.BUSINESS.PROFILE);
  },

  // ==================== API Key Management ====================

  /**
   * Generate a new API key
   * @param {object} keyConfig - API key configuration
   * @param {string} keyConfig.name - Human-readable key name
   * @param {Array<string>} keyConfig.permissions - Permissions array (charge|refund|balance|transactions)
   * @param {Array<string>} keyConfig.allowedOrigins - CORS allowed origins
   * @param {string} keyConfig.environment - Environment (live|test)
   * @returns {Promise<object>} Generated API key (key only shown once!)
   */
  generateAPIKey: async (keyConfig) => {
    return await axiosInstance.post(ENDPOINTS.BUSINESS.API_KEYS, keyConfig);
  },

  /**
   * List all API keys for business
   * @returns {Promise<Array>} List of API keys (keys are not included, only metadata)
   */
  listAPIKeys: async () => {
    return await axiosInstance.get(ENDPOINTS.BUSINESS.API_KEYS);
  },

  /**
   * Revoke an API key
   * @param {string} keyId - API key ID
   * @param {string} reason - Reason for revocation (optional)
   * @returns {Promise<object>} Revocation confirmation
   */
  revokeAPIKey: async (keyId, reason = '') => {
    return await axiosInstance.delete(ENDPOINTS.BUSINESS.API_KEY_BY_ID(keyId), {
      data: { reason }
    });
  },

  // ==================== CORS Origin Management ====================

  /**
   * Get CORS origins for an API key
   * @param {string} keyId - API key ID
   * @returns {Promise<Array>} List of allowed origins
   */
  getKeyOrigins: async (keyId) => {
    return await axiosInstance.get(ENDPOINTS.BUSINESS.ORIGINS(keyId));
  },

  /**
   * Update all CORS origins for an API key
   * @param {string} keyId - API key ID
   * @param {Array<string>} origins - Array of allowed origins
   * @returns {Promise<object>} Update confirmation
   */
  updateKeyOrigins: async (keyId, origins) => {
    return await axiosInstance.put(ENDPOINTS.BUSINESS.ORIGINS(keyId), {
      origins
    });
  },

  /**
   * Add a single CORS origin to an API key
   * @param {string} keyId - API key ID
   * @param {string} origin - Origin URL to add
   * @returns {Promise<object>} Update confirmation
   */
  addKeyOrigin: async (keyId, origin) => {
    return await axiosInstance.post(ENDPOINTS.BUSINESS.ORIGINS(keyId), {
      origin
    });
  },

  /**
   * Remove a CORS origin from an API key
   * @param {string} keyId - API key ID
   * @param {string} origin - Origin URL to remove
   * @returns {Promise<object>} Update confirmation
   */
  removeKeyOrigin: async (keyId, origin) => {
    return await axiosInstance.delete(ENDPOINTS.BUSINESS.ORIGINS(keyId), {
      data: { origin }
    });
  },

  // ==================== Admin Functions ====================

  /**
   * Get all pending business accounts (Admin only)
   * @returns {Promise<Array>} List of pending businesses
   */
  getPendingBusinesses: async () => {
    return await axiosInstance.get(ENDPOINTS.BUSINESS.PENDING);
  },

  /**
   * Get all verified business accounts (Admin only)
   * @returns {Promise<Array>} List of verified businesses
   */
  getVerifiedBusinesses: async () => {
    return await axiosInstance.get(ENDPOINTS.BUSINESS.VERIFIED);
  },

  /**
   * Verify a business account (Admin only)
   * @param {string} businessId - Business user ID
   * @returns {Promise<object>} Verification confirmation
   */
  verifyBusiness: async (businessId) => {
    return await axiosInstance.put(ENDPOINTS.BUSINESS.VERIFY(businessId));
  },

  // ==================== Utility Functions ====================

  /**
   * Check if API key is live or test
   * @param {string} keyPrefix - API key prefix (e.g., "scb_live_abc")
   * @returns {string} Environment type ("live" or "test")
   */
  getKeyEnvironment: (keyPrefix) => {
    return keyPrefix.includes('_live_') ? 'live' : 'test';
  },

  /**
   * Validate API key format
   * @param {string} apiKey - API key to validate
   * @returns {boolean} True if valid format
   */
  isValidKeyFormat: (apiKey) => {
    return /^scb_(live|test)_[a-zA-Z0-9]{64,}$/.test(apiKey);
  },

  /**
   * Format API key for display (show only prefix)
   * @param {string} keyPrefix - API key prefix
   * @returns {string} Formatted key for display
   */
  formatKeyForDisplay: (keyPrefix) => {
    return `${keyPrefix}...`;
  },

  /**
   * Get permission display names
   * @param {Array<string>} permissions - Permission array
   * @returns {Array<string>} Display names
   */
  getPermissionDisplayNames: (permissions) => {
    const displayMap = {
      charge: 'Process Payments',
      refund: 'Issue Refunds',
      balance: 'View Balance',
      transactions: 'View Transactions'
    };
    
    return permissions.map(p => displayMap[p] || p);
  },

  /**
   * Calculate API key usage percentage
   * @param {number} used - Used requests
   * @param {number} limit - Request limit
   * @returns {number} Usage percentage (0-100)
   */
  calculateUsagePercentage: (used, limit) => {
    if (limit === 0) return 0;
    return Math.min(100, (used / limit) * 100);
  }
};
