import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, getAuthErrorMessage } from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('finora_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Re-verify session on app startup
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('finora_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await authService.getMe();
      setUser(data.user);
    } catch (err) {
      console.warn('Session verification failed:', err?.response?.data?.message || err.message);
      setUser(null);
      localStorage.removeItem('finora_token');
      localStorage.removeItem('finora_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login handler
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const data = await authService.login(email, password);
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      return data;
    } catch (err) {
      const message = getAuthErrorMessage(err, 'login');
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register handler
  const register = async (name, email, password) => {
    try {
      setIsLoading(true);
      const data = await authService.register(name, email, password);
      setUser(data.user);
      toast.success(`Account created successfully! Welcome to Finora, ${data.user.name}.`);
      return data;
    } catch (err) {
      const message = getAuthErrorMessage(err, 'register');
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      toast.success('Successfully logged out.');
    } catch (err) {
      setUser(null);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser: checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
