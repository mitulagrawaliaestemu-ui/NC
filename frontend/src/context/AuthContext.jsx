/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { buildApiUrl } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Setup Axios-like fetch helper with auth header
  const authFetch = useCallback(async (url, options = {}) => {
    const headers = {};
    
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    Object.assign(headers, options.headers);

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(buildApiUrl(url), {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, [token]);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          // Fetch current user details
          const data = await authFetch('/api/auth/me');
          setUser(data);
        } catch (error) {
          console.error('Failed to load user session:', error);
          // Token is invalid/expired
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [authFetch, token]);

  const login = async (email, password) => {
    try {
      const response = await fetch(buildApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      // Use user data from login response
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const register = async (name, email, password, lc) => {
    try {
      const response = await fetch(buildApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, lc }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      // Use user data from register response
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateResume = async (resumeData) => {
    try {
      const data = await authFetch('/api/auth/resume', {
        method: 'PUT',
        body: JSON.stringify(resumeData),
      });
      setUser(prev => ({ ...prev, resume: data.resume }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const resetTempPassword = async (newPassword) => {
    try {
      const data = await authFetch('/api/auth/reset-temp-password', {
        method: 'PUT',
        body: JSON.stringify({ newPassword }),
      });
      setUser(prev => ({ ...prev, isTempPassword: false, tempPassword: null }));
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateResume, resetTempPassword, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
