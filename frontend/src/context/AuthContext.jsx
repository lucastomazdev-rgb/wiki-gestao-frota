import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setStoredToken, clearStoredToken } from '../services/api';

const AuthContext = createContext(null);

export { api };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Setup Axios interceptor to catch 401 unauthorized globally
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          clearStoredToken();
          setUser(null);
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  // Check user session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data.status === 'success') {
          setUser(response.data.data.user);
        }
      } catch (err) {
        clearStoredToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.status === 'success') {
        const { user: userData, token } = response.data.data;
        if (token) {
          setStoredToken(token);
        }
        setUser(userData);
        return true;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'E-mail ou senha incorretos.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/register', { email, password, name });
      if (response.data.status === 'success') {
        const { user: userData, token } = response.data.data;
        if (token) {
          setStoredToken(token);
        }
        setUser(userData);
        return true;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erro ao registrar usuário.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      clearStoredToken();
      setUser(null);
      setLoading(false);
    }
  };

  const getNomePerfil = () => {
    if (!user) return 'Convidado';
    return user.role === 'ADMIN' ? 'Supervisor' : 'Técnico';
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, setUser, getNomePerfil }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
