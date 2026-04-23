import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  withCredentials: true,
});

// Attach JWT to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle database unavailable errors gracefully
    if (error.response?.status === 503) {
      console.error('Database temporarily unavailable:', error.response.data?.error);
      // Don't redirect, just show error
      return Promise.reject(new Error('Service temporarily unavailable. Please try again later.'));
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect only if not already on auth pages
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
