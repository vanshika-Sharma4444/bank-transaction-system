import api from './api';

export const accountService = {
  // Fetch all accounts belonging to the logged-in user
  getUserAccounts: async () => {
    const response = await api.get('/account');
    return response.data.accounts || [];
  },

  // Create a new banking account for the logged-in user
  createAccount: async () => {
    const response = await api.post('/account');
    return response.data.account;
  },

  // Get real-time aggregated balance for a specific account
  getAccountBalance: async (accountId) => {
    const response = await api.get(`/account/balance/${accountId}`);
    return response.data.balance;
  },
};
