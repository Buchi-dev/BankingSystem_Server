import { client } from './client';

export const transactionApi = {
  keys: {
    myTransactions: ['transactions', 'mine'],
    bankStatus: ['transactions', 'bankStatus'], // Admin only
  },

  // Get My History
  getMyTransactions: () => client('/transactions'),

  // Actions
  transfer: (data) => client('/transactions/transfer', { body: data }),
  deposit: (data) => client('/transactions/deposit', { body: data }),
  withdraw: (data) => client('/transactions/withdraw', { body: data }),

  // Admin Only
  getBankStatus: () => client('/transactions/bank/status'),
};
