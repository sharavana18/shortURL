import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const REDIRECT_URL = import.meta.env.VITE_REDIRECT_URL || 'http://localhost:5000/r';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      const storedEmail = localStorage.getItem('userEmail');
      if (storedEmail) {
        setUser({ email: storedEmail });
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', data.email);
      setToken(data.token);
      setUser({ email: data.email });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', data.email);
      setToken(data.token);
      setUser({ email: data.email });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setToken(null);
    setUser(null);
  };

  // Helper fetcher function that automatically appends the JWT Authorization header and base API_URL
  const authFetch = async (endpoint, options = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      logout();
    }

    return res;
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    authFetch
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
