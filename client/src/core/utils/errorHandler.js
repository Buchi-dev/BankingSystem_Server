/**
 * Handle API errors and return standardized error object
 * @param {Error} error - The error object from axios
 * @returns {object} Standardized error response
 */
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      success: false,
      message: error.response.data?.message || 'Server error occurred',
      errors: error.response.data?.errors || [],
      statusCode: error.response.status,
      data: error.response.data
    };
  } else if (error.request) {
    // Request made but no response received
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      errors: [],
      statusCode: 0
    };
  } else {
    // Something else happened
    return {
      success: false,
      message: error.message || 'An unknown error occurred',
      errors: [],
      statusCode: 0
    };
  }
};

/**
 * Display user-friendly error message
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
export const displayError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

/**
 * Check if error is authentication related
 * @param {Error} error - The error object
 * @returns {boolean} True if auth error
 */
export const isAuthError = (error) => {
  return error.response?.status === 401;
};

/**
 * Check if error is permission related
 * @param {Error} error - The error object
 * @returns {boolean} True if permission error
 */
export const isPermissionError = (error) => {
  return error.response?.status === 403;
};

/**
 * Check if error is validation related
 * @param {Error} error - The error object
 * @returns {boolean} True if validation error
 */
export const isValidationError = (error) => {
  return error.response?.status === 400;
};
