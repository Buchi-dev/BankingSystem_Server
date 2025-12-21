// API Configuration
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// API Version (can be configured for different environments)
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';

// Helper to build versioned endpoints
const versionedPath = (path) => `/${API_VERSION}${path}`;

// API Endpoints
export const ENDPOINTS = {
  // User endpoints
  USER: {
    REGISTER: versionedPath('/users/register'),
    LOGIN: versionedPath('/users/login'),
    PROFILE: versionedPath('/users/profile'),
    ALL: versionedPath('/users'),
    BY_ID: (id) => versionedPath(`/users/${id}`)
  },
  
  // Transaction endpoints
  TRANSACTION: {
    ALL: versionedPath('/transactions'),
    TRANSFER: versionedPath('/transactions/transfer'),
    DEPOSIT: versionedPath('/transactions/deposit'),
    WITHDRAW: versionedPath('/transactions/withdraw'),
    BANK_STATUS: versionedPath('/transactions/bank/status')
  },
  
  // Business endpoints
  BUSINESS: {
    REGISTER: versionedPath('/business/register'),
    PROFILE: versionedPath('/business/profile'),
    API_KEYS: versionedPath('/business/api-keys'),
    API_KEY_BY_ID: (id) => versionedPath(`/business/api-keys/${id}`),
    ORIGINS: (id) => versionedPath(`/business/api-keys/${id}/origins`),
    PENDING: versionedPath('/business/pending'),
    VERIFIED: versionedPath('/business/verified'),
    VERIFY: (id) => versionedPath(`/business/${id}/verify`)
  },
  
  // Public API endpoints
  PUBLIC: {
    VERIFY: versionedPath('/public/verify'),
    CHARGE: versionedPath('/public/transactions/charge'),
    REFUND: versionedPath('/public/transactions/refund'),
    TRANSACTIONS: versionedPath('/public/transactions'),
    TRANSACTION_BY_ID: (id) => versionedPath(`/public/transactions/${id}`),
    BALANCE: versionedPath('/public/balance'),
    VERIFY_CARD: versionedPath('/public/cards/verify')
  }
};
