// Token Management Utilities
const TOKEN_KEY = 'auth_token';

export const tokenManager = {
  /**
   * Get the stored authentication token
   * @returns {string|null} The token or null if not found
   */
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  /**
   * Store the authentication token in localStorage
   * @param {string} token - The JWT token to store
   */
  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  
  /**
   * Remove the authentication token from localStorage
   */
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
  },
  
  /**
   * Decode JWT token payload
   * @param {string} token - The JWT token to decode
   * @returns {object|null} Decoded payload or null if invalid
   */
  decodeToken: (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  },
  
  /**
   * Check if token is expired
   * @param {string} token - The JWT token to check
   * @returns {boolean} True if expired, false otherwise
   */
  isTokenExpired: (token) => {
    const decoded = tokenManager.decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    return decoded.exp * 1000 < Date.now();
  },
  
  /**
   * Get the current user from token
   * @returns {object|null} User data from token or null
   */
  getCurrentUser: () => {
    const token = tokenManager.getToken();
    if (!token || tokenManager.isTokenExpired(token)) {
      return null;
    }
    return tokenManager.decodeToken(token);
  },
  
  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated with valid token
   */
  isAuthenticated: () => {
    const token = tokenManager.getToken();
    return token && !tokenManager.isTokenExpired(token);
  }
};
