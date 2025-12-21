import axiosInstance from '../utils/axiosInstance';
import { ENDPOINTS } from '../config/api.config';

/**
 * Transaction Service - Handles all transaction-related API calls
 */
export const transactionService = {
  /**
   * Get all transactions for authenticated user
   * @returns {Promise<Array>} List of user transactions
   */
  getUserTransactions: async () => {
    return await axiosInstance.get(ENDPOINTS.TRANSACTION.ALL);
  },

  /**
   * Transfer funds to another user
   * @param {string} recipientId - Recipient user ID
   * @param {number} amount - Amount to transfer
   * @returns {Promise<object>} Transaction response
   */
  transferFunds: async (recipientId, amount) => {
    return await axiosInstance.post(ENDPOINTS.TRANSACTION.TRANSFER, {
      to: recipientId,
      amount: parseFloat(amount)
    });
  },

  /**
   * Deposit funds from bank to wallet
   * @param {number} amount - Amount to deposit
   * @returns {Promise<object>} Transaction response
   */
  depositFunds: async (amount) => {
    return await axiosInstance.post(ENDPOINTS.TRANSACTION.DEPOSIT, {
      amount: parseFloat(amount)
    });
  },

  /**
   * Withdraw funds from wallet to bank
   * @param {number} amount - Amount to withdraw
   * @returns {Promise<object>} Transaction response
   */
  withdrawFunds: async (amount) => {
    return await axiosInstance.post(ENDPOINTS.TRANSACTION.WITHDRAW, {
      amount: parseFloat(amount)
    });
  },

  /**
   * Get bank status and statistics (Admin only)
   * @returns {Promise<object>} Bank status data
   */
  getBankStatus: async () => {
    return await axiosInstance.get(ENDPOINTS.TRANSACTION.BANK_STATUS);
  },

  /**
   * Filter transactions by type
   * @param {Array} transactions - Array of transactions
   * @param {string} type - Transaction type (deposit|withdraw|transfer|payment|refund)
   * @returns {Array} Filtered transactions
   */
  filterByType: (transactions, type) => {
    return transactions.filter(tx => tx.type === type);
  },

  /**
   * Filter transactions by status
   * @param {Array} transactions - Array of transactions
   * @param {string} status - Transaction status (pending|completed|failed|refunded)
   * @returns {Array} Filtered transactions
   */
  filterByStatus: (transactions, status) => {
    return transactions.filter(tx => tx.status === status);
  },

  /**
   * Filter transactions by date range
   * @param {Array} transactions - Array of transactions
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @returns {Array} Filtered transactions
   */
  filterByDateRange: (transactions, startDate, endDate) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    return transactions.filter(tx => {
      const txDate = new Date(tx.createdAt).getTime();
      return txDate >= start && txDate <= end;
    });
  },

  /**
   * Calculate total amount from transactions
   * @param {Array} transactions - Array of transactions
   * @returns {number} Total amount
   */
  calculateTotal: (transactions) => {
    return transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  },

  /**
   * Sort transactions by date (newest first)
   * @param {Array} transactions - Array of transactions
   * @returns {Array} Sorted transactions
   */
  sortByDate: (transactions) => {
    return [...transactions].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  },

  /**
   * Sort transactions by amount (highest first)
   * @param {Array} transactions - Array of transactions
   * @returns {Array} Sorted transactions
   */
  sortByAmount: (transactions) => {
    return [...transactions].sort((a, b) => b.amount - a.amount);
  },

  /**
   * Get transaction statistics
   * @param {Array} transactions - Array of transactions
   * @returns {object} Transaction statistics
   */
  getStatistics: (transactions) => {
    const total = transactions.length;
    const completed = transactions.filter(tx => tx.status === 'completed').length;
    const pending = transactions.filter(tx => tx.status === 'pending').length;
    const failed = transactions.filter(tx => tx.status === 'failed').length;
    
    const totalAmount = transactions
      .filter(tx => tx.status === 'completed')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    
    const byType = {
      deposit: transactions.filter(tx => tx.type === 'deposit').length,
      withdraw: transactions.filter(tx => tx.type === 'withdraw').length,
      transfer: transactions.filter(tx => tx.type === 'transfer').length,
      payment: transactions.filter(tx => tx.type === 'payment').length,
      refund: transactions.filter(tx => tx.type === 'refund').length
    };
    
    return {
      total,
      completed,
      pending,
      failed,
      totalAmount,
      byType,
      successRate: total > 0 ? (completed / total) * 100 : 0
    };
  }
};
