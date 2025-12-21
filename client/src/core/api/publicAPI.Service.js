import axios from 'axios';
import { API_CONFIG, ENDPOINTS } from '../config/api.config';

/**
 * Public API Service - For external integration and testing
 * Uses API Key authentication via X-API-Key header
 */

// Create separate axios instance for public API (no JWT interceptors)
const publicAPIInstance = axios.create(API_CONFIG);

// Add response interceptor for consistent error handling
publicAPIInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Log errors in development
    if (import.meta.env.DEV) {
      console.error('Public API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data
      });
    }
    return Promise.reject(error);
  }
);

export const publicAPIService = {
  /**
   * Set API key for all subsequent requests
   * @param {string} apiKey - The API key to use for authentication
   */
  setAPIKey: (apiKey) => {
    publicAPIInstance.defaults.headers['X-API-Key'] = apiKey;
  },

  /**
   * Remove API key from headers
   */
  clearAPIKey: () => {
    delete publicAPIInstance.defaults.headers['X-API-Key'];
  },

  /**
   * Get current API key (if set)
   * @returns {string|undefined} Current API key
   */
  getAPIKey: () => {
    return publicAPIInstance.defaults.headers['X-API-Key'];
  },

  // ==================== API Key Verification ====================

  /**
   * Verify API key and get configuration
   * @returns {Promise<object>} API key verification response with business info and usage stats
   */
  verifyKey: async () => {
    return await publicAPIInstance.get(ENDPOINTS.PUBLIC.VERIFY);
  },

  // ==================== Card Transactions ====================

  /**
   * Charge a customer's card
   * @param {object} cardData - Card transaction data
   * @param {string} cardData.cardNumber - 16-digit card number
   * @param {string} cardData.cvv - 3-digit CVV
   * @param {number} cardData.amount - Amount to charge
   * @param {string} cardData.description - Transaction description
   * @param {string} cardData.externalReference - Optional external reference
   * @returns {Promise<object>} Transaction response
   */
  chargeCard: async (cardData) => {
    return await publicAPIInstance.post(ENDPOINTS.PUBLIC.CHARGE, cardData);
  },

  /**
   * Verify card without charging
   * @param {string} cardNumber - 16-digit card number
   * @param {string} cvv - 3-digit CVV
   * @returns {Promise<object>} Card verification response
   */
  verifyCard: async (cardNumber, cvv) => {
    return await publicAPIInstance.post(ENDPOINTS.PUBLIC.VERIFY_CARD, {
      cardNumber,
      cvv
    });
  },

  // ==================== Refunds ====================

  /**
   * Refund a transaction
   * @param {object} refundData - Refund data
   * @param {string} refundData.transactionId - Original transaction ID
   * @param {number} refundData.amount - Amount to refund (optional, defaults to full amount)
   * @param {string} refundData.reason - Refund reason
   * @returns {Promise<object>} Refund response
   */
  refundTransaction: async (refundData) => {
    return await publicAPIInstance.post(ENDPOINTS.PUBLIC.REFUND, refundData);
  },

  // ==================== Transaction Management ====================

  /**
   * Get business transactions
   * @param {object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Results per page (default: 20)
   * @param {string} params.status - Filter by status (pending|completed|failed|refunded)
   * @param {string} params.startDate - Start date (ISO string)
   * @param {string} params.endDate - End date (ISO string)
   * @returns {Promise<object>} Paginated transaction list
   */
  getTransactions: async (params = {}) => {
    return await publicAPIInstance.get(ENDPOINTS.PUBLIC.TRANSACTIONS, { params });
  },

  /**
   * Get specific transaction by ID
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<object>} Transaction details
   */
  getTransactionById: async (transactionId) => {
    return await publicAPIInstance.get(ENDPOINTS.PUBLIC.TRANSACTION_BY_ID(transactionId));
  },

  // ==================== Business Balance ====================

  /**
   * Get business wallet balance
   * @returns {Promise<object>} Balance information
   */
  getBalance: async () => {
    return await publicAPIInstance.get(ENDPOINTS.PUBLIC.BALANCE);
  },

  // ==================== Utility Functions ====================

  /**
   * Create a one-time API key header for a single request
   * @param {string} apiKey - The API key to use
   * @returns {object} Headers object with API key
   */
  createAuthHeaders: (apiKey) => {
    return {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    };
  },

  /**
   * Make a custom request with specific API key (doesn't affect instance default)
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {string} apiKey - API key to use
   * @param {object} data - Request data (optional)
   * @returns {Promise<object>} Response data
   */
  customRequest: async (method, endpoint, apiKey, data = null) => {
    const config = {
      method,
      url: endpoint,
      headers: publicAPIService.createAuthHeaders(apiKey)
    };
    
    if (data) {
      config.data = data;
    }
    
    return await publicAPIInstance.request(config);
  },

  /**
   * Test API key with a verification request
   * @param {string} apiKey - API key to test
   * @returns {Promise<object>} Verification result
   */
  testAPIKey: async (apiKey) => {
    try {
      const originalKey = publicAPIService.getAPIKey();
      publicAPIService.setAPIKey(apiKey);
      
      const result = await publicAPIService.verifyKey();
      
      // Restore original key if one was set
      if (originalKey) {
        publicAPIService.setAPIKey(originalKey);
      } else {
        publicAPIService.clearAPIKey();
      }
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to verify API key' }
      };
    }
  },

  /**
   * Format card number for API request (remove spaces/dashes)
   * @param {string} cardNumber - Card number with formatting
   * @returns {string} Clean card number
   */
  formatCardForRequest: (cardNumber) => {
    return cardNumber.replace(/[\s-]/g, '');
  },

  /**
   * Validate transaction amount
   * @param {number} amount - Amount to validate
   * @param {number} maxAmount - Maximum allowed amount
   * @returns {object} Validation result
   */
  validateTransactionAmount: (amount, maxAmount = 100000) => {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      return {
        isValid: false,
        error: 'Amount must be a positive number'
      };
    }
    
    if (numAmount > maxAmount) {
      return {
        isValid: false,
        error: `Amount exceeds maximum limit of ₱${maxAmount.toFixed(2)}`
      };
    }
    
    return {
      isValid: true,
      error: null
    };
  }
};
