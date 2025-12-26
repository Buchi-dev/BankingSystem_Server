import { client } from './client';

export const bankingApi = {
  // 1. GET Balance
  getBalance: () => client('/balance'), 
  // Calls: GET http://localhost:5000/api/balance

  // 2. GET Transactions
  getTransactions: () => client('/transactions'),
  // Calls: GET http://localhost:5000/api/transactions

  // 3. POST Transfer
  sendMoney: (data) => client('/transfer', { body: data }),
  // Calls: POST http://localhost:5000/api/transfer
  // Data: { recipient: "...", amount: 100 }
};
