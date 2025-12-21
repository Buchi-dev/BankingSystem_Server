import axiosInstance from '../utils/axiosInstance';
import { ENDPOINTS } from '../config/api.config';
import { tokenManager } from '../utils/tokenManager';

/**
 * User Service - Handles all user-related API calls
 */
export const userService = {
  /**
   * Register a new user account
   * @param {object} userData - User registration data
   * @param {object} userData.fullName - Full name object
   * @param {string} userData.fullName.firstName - First name
   * @param {string} userData.fullName.lastName - Last name
   * @param {string} userData.fullName.middleInitial - Middle initial (optional)
   * @param {string} userData.email - Email address (@smu.edu.ph)
   * @param {string} userData.password - Password
   * @returns {Promise<object>} Registration response with user and token
   */
  register: async (userData) => {
    const response = await axiosInstance.post(ENDPOINTS.USER.REGISTER, userData);
    
    // Store token after successful registration
    if (response.data?.token) {
      tokenManager.setToken(response.data.token);
    }
    
    return response;
  },

  /**
   * Login user with credentials
   * @param {object} credentials - Login credentials
   * @param {string} credentials.email - Email address
   * @param {string} credentials.password - Password
   * @returns {Promise<object>} Login response with user and token
   */
  login: async (credentials) => {
    const response = await axiosInstance.post(ENDPOINTS.USER.LOGIN, credentials);
    
    // Store token after successful login
    if (response.data?.token) {
      tokenManager.setToken(response.data.token);
    }
    
    return response;
  },

  /**
   * Logout current user
   * Removes token from localStorage
   */
  logout: () => {
    tokenManager.removeToken();
  },

  /**
   * Get current user's profile
   * @returns {Promise<object>} User profile data
   */
  getProfile: async () => {
    return await axiosInstance.get(ENDPOINTS.USER.PROFILE);
  },

  /**
   * Get all users (Admin only)
   * @returns {Promise<Array>} List of all users
   */
  getAllUsers: async () => {
    return await axiosInstance.get(ENDPOINTS.USER.ALL);
  },

  /**
   * Get user by ID (Admin only)
   * @param {string} userId - User ID
   * @returns {Promise<object>} User data
   */
  getUserById: async (userId) => {
    return await axiosInstance.get(ENDPOINTS.USER.BY_ID(userId));
  },

  /**
   * Create new user (Admin only)
   * @param {object} userData - User data
   * @returns {Promise<object>} Created user data
   */
  createUser: async (userData) => {
    return await axiosInstance.post(ENDPOINTS.USER.ALL, userData);
  },

  /**
   * Update user information (Admin only)
   * @param {string} userId - User ID
   * @param {object} userData - Updated user data
   * @returns {Promise<object>} Updated user data
   */
  updateUser: async (userId, userData) => {
    return await axiosInstance.put(ENDPOINTS.USER.BY_ID(userId), userData);
  },

  /**
   * Delete user (Admin only)
   * @param {string} userId - User ID
   * @returns {Promise<object>} Deletion confirmation
   */
  deleteUser: async (userId) => {
    return await axiosInstance.delete(ENDPOINTS.USER.BY_ID(userId));
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated: () => {
    return tokenManager.isAuthenticated();
  },

  /**
   * Get current user from token
   * @returns {object|null} Current user data or null
   */
  getCurrentUser: () => {
    return tokenManager.getCurrentUser();
  }
};
