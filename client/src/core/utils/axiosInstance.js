import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { tokenManager } from './tokenManager';

// Create axios instance with default config
const axiosInstance = axios.create(API_CONFIG);

// Request interceptor - Add JWT token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token && !tokenManager.isTokenExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle responses and errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    // Return the full response data
    return response.data;
  },
  (error) => {
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      tokenManager.removeToken();
      // Redirect to login page
      window.location.href = '/login';
    }
    
    // Handle 403 Forbidden - Insufficient permissions
    if (error.response?.status === 403) {
      console.error('Access denied:', error.response.data?.message);
    }
    
    // Log errors in development
    if (import.meta.env.DEV) {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data
      });
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
