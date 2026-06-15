import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

// Decode JWT payload without external library
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

const getErrorMessage = (error, fallback) => {
  const data = error.response?.data;
  if (!data) return fallback;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) return data.detail.join(', ');
  if (typeof data === 'string') return data;
  if (typeof data === 'object') {
    const msgs = Object.values(data).flat();
    return msgs.join(', ');
  }
  return fallback;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from token on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      const payload = parseJwt(token);
      if (payload && payload.exp * 1000 > Date.now()) {
        setUser({ username: payload.username || payload.user_id || 'User' });
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
    setLoading(false);
  }, []);

  const setSession = (tokens) => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    const payload = parseJwt(tokens.access);
    setUser({ username: payload?.username || payload?.user_id || 'User' });
  };

  // Normal password login
  const login = async (identifier, password) => {
    try {
      const res = await api.post('accounts/login/', { identifier, password });
      setSession(res.data);
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'Login failed. Check your credentials.') };
    }
  };

  // Request OTP email
  const requestOtp = async (identifier) => {
    try {
      const res = await api.post('accounts/otp/request/', { identifier });
      return { success: true, message: res.data.detail };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'Unable to send OTP.') };
    }
  };

  // Login with OTP (works for both emailed OTP and common OTP)
  const loginWithOtp = async (identifier, otp) => {
    try {
      const res = await api.post('accounts/otp/verify/', { identifier, otp });
      // OTP response includes username directly
      const tokens = { access: res.data.access, refresh: res.data.refresh };
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      const payload = parseJwt(tokens.access);
      const username = res.data.username || payload?.username || identifier;
      setUser({ username });
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'OTP verification failed.') };
    }
  };

  const register = async (username, email, password) => {
    try {
      await api.post('accounts/register/', { username, email, password });
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'Registration failed.') };
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
