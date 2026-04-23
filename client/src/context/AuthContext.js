import React, { createContext, useContext, useReducer, useEffect } from 'react';
import API from '../utils/api';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      return { ...state, user: action.payload.user, token: action.payload.token, loading: false, isAuthenticated: true };
    case 'UPDATE_USER':
      const updatedUser = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { ...state, user: updatedUser };
    case 'LOGOUT':
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { ...state, user: null, token: null, isAuthenticated: false, loading: false };
    case 'AUTH_ERROR':
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { ...state, user: null, token: null, isAuthenticated: false, loading: false };
    default:
      return state;
  }
};

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: true,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verify token on mount
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }
      try {
        const { data } = await API.get('/auth/me');
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.data, token } });
      } catch {
        dispatch({ type: 'AUTH_ERROR' });
      }
    };
    verifyAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    dispatch({ type: 'LOGIN_SUCCESS', payload: data });
    return data;
  };

  const register = async (formData) => {
    const { data } = await API.post('/auth/register', formData);
    dispatch({ type: 'LOGIN_SUCCESS', payload: data });
    return data;
  };

  const logout = async () => {
    try { await API.post('/auth/logout'); } catch {}
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const refreshUser = async () => {
    const { data } = await API.get('/auth/me');
    dispatch({ type: 'UPDATE_USER', payload: data.data });
    return data.data;
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      logout,
      updateUser,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
