import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

const getErrorMessage = (error, fallbackMessage) => {
  const data = error.response?.data;
  if (!data) {
    return fallbackMessage;
  }

  if (typeof data.detail === 'string') {
    return data.detail;
  }

  if (Array.isArray(data.detail)) {
    return data.detail.join(', ');
  }

  if (typeof data === 'string') {
    return data;
  }

  if (typeof data === 'object') {
    return Object.values(data)
      .flat()
      .join(', ');
  }

  return fallbackMessage;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        // In a real app, you'd verify the token or fetch user details here
        // For now, we'll assume valid if token exists
        setUser({ username: 'Profile' }); // Placeholder
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const setSession = (identifier, tokens) => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    setUser({ username: identifier });
  };

  const login = async (identifier, password) => {
    try {
      const response = await api.post('accounts/login/', { identifier, password });
      setSession(identifier, response.data);
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'Login failed') };
    }
  };

  const requestOtp = async (identifier) => {
    try {
      const response = await api.post('accounts/otp/request/', { identifier });
      return { success: true, message: response.data.detail };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'Unable to send OTP') };
    }
  };

  const loginWithOtp = async (identifier, otp) => {
    try {
      const response = await api.post('accounts/otp/verify/', { identifier, otp });
      setSession(identifier, response.data);
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'OTP login failed') };
    }
  };

  const register = async (username, email, password) => {
    try {
      await api.post('accounts/register/', { username, email, password });
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'Registration failed') };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, requestOtp, loginWithOtp, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
