import api from './api';

export const getAuthErrorMessage = (error, action) => {
  const serverMessage = error?.response?.data?.message;
  if (serverMessage) return serverMessage;

  if (!error?.response) {
    return 'Could not reach the banking server. Check that it is running and that this frontend URL is allowed.';
  }

  if (error.response.status >= 500) {
    return 'The banking server could not complete this request. Please try again later.';
  }

  if (error.response.status === 409 || error.response.status === 422) {
    return action === 'register'
      ? 'An account with this email address already exists.'
      : 'Please check your sign-in details and try again.';
  }

  if (error.response.status === 400) {
    return 'Please check the information you entered and try again.';
  }

  return action === 'register'
    ? 'Unable to create your account. Please try again.'
    : 'Unable to sign in. Please try again.';
};

export const authService = {
  // Register new user
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    if (response.data.token) {
      localStorage.setItem('finora_token', response.data.token);
    }
    if (response.data.user) {
      localStorage.setItem('finora_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Login existing user
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('finora_token', response.data.token);
    }
    if (response.data.user) {
      localStorage.setItem('finora_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Logout current user
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      localStorage.removeItem('finora_token');
      localStorage.removeItem('finora_user');
    }
  },

  // Get current logged-in user profile from backend
  getMe: async () => {
    const response = await api.get('/auth/me');
    if (response.data.user) {
      localStorage.setItem('finora_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
};
