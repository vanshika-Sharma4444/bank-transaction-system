import api from './api';

export const transactionService = {
  // Execute a user-to-user money transfer
  createTransaction: async ({ fromAccount, toAccount, amount, idempotencyKey }) => {
    const response = await api.post('/transaction', {
      fromAccount,
      toAccount,
      amount,
      idempotencyKey,
    });
    return response.data;
  },

  // Fetch full transaction history for user's accounts
  getUserTransactions: async () => {
    const response = await api.get('/transaction');
    return response.data.transactions || [];
  },

  // List active recipient accounts for a system user to fund
  getEligibleFundingAccounts: async () => {
    const response = await api.get('/transaction/system/eligible-accounts');
    return response.data.accounts || [];
  },

  // Privileged endpoint for system initial funds deposit
  createInitialFunds: async ({ toAccount, amount, idempotencyKey }) => {
    const response = await api.post('/transaction/system/initial-funds', {
      toAccount,
      amount,
      idempotencyKey,
    });
    return response.data;
  },
};
