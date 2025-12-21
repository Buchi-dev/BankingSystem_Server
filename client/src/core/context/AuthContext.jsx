// contexts/AuthContext.jsx
import { createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenManager } from '../utils/tokenManager';
import { userService } from '../api/user.Service';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  
  /**
   * Logout user and redirect to login page
   * Uses tokenManager for consistent localStorage management
   */
  const logout = () => {
    tokenManager.removeToken();
    navigate('/login', { replace: true });
  };

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated with valid token
   */
  const isAuthenticated = () => {
    return tokenManager.isAuthenticated();
  };

  /**
   * Get current user from token
   * @returns {object|null} Current user data or null
   */
  const getCurrentUser = () => {
    return tokenManager.getCurrentUser();
  };

  /**
   * Login user with credentials
   * @param {object} credentials - Email and password
   * @returns {Promise<object>} Login response
   */
  const login = async (credentials) => {
    return await userService.login(credentials);
  };

  /**
   * Register new user
   * @param {object} userData - Registration data
   * @returns {Promise<object>} Registration response
   */
  const register = async (userData) => {
    return await userService.register(userData);
  };

  const value = {
    logout,
    login,
    register,
    isAuthenticated,
    getCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
