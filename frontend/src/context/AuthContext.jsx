import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('cp_auth_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore authenticated session on mount or reload
  const checkAuthStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      // Calls /api/auth/me using HTTP-only cookie or Bearer token header
      const res = await authApi.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('cp_auth_token');
      }
    } catch (err) {
      // 401 or network error - clear state
      setUser(null);
      setToken(null);
      localStorage.removeItem('cp_auth_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    if (res.success && res.user) {
      setUser(res.user);
      if (res.token) {
        setToken(res.token);
        localStorage.setItem('cp_auth_token', res.token);
      }
      return res;
    }
    throw new Error(res.message || 'Login failed.');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Continue client cleanup even if server request fails
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('cp_auth_token');
    }
  };

  const updateUser = (updatedUser, newToken) => {
    if (updatedUser) {
      setUser(updatedUser);
    }
    if (newToken) {
      setToken(newToken);
      localStorage.setItem('cp_auth_token', newToken);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    logout,
    updateUser,
    refreshSession: checkAuthStatus,
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
