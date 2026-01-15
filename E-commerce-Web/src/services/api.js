import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints (Security service)
export const authApi = {
  login: (credentials) => api.post('/SECURITY/auth/login', credentials),
  register: (userData) => api.post('/SECURITY/auth/register', userData),
  logout: () => api.post('/SECURITY/auth/logout'),
  getProfile: () => api.get('/SECURITY/user/profile'),
};

// Product endpoints (Backend service - to be created)
export const productApi = {
  getAll: (params) => api.get('/BACKEND/products', { params }),
  getById: (id) => api.get(`/BACKEND/products/${id}`),
  getByCategory: (category) => api.get(`/BACKEND/products/category/${category}`),
  search: (query) => api.get('/BACKEND/products/search', { params: { q: query } }),
  getCategories: () => api.get('/BACKEND/categories'),
};

// Cart endpoints
export const cartApi = {
  get: () => api.get('/BACKEND/cart'),
  addItem: (productId, quantity) => api.post('/BACKEND/cart/items', { productId, quantity }),
  updateItem: (itemId, quantity) => api.put(`/BACKEND/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId) => api.delete(`/BACKEND/cart/items/${itemId}`),
  clear: () => api.delete('/BACKEND/cart'),
};

// Order endpoints
export const orderApi = {
  create: (orderData) => api.post('/BACKEND/orders', orderData),
  getAll: () => api.get('/BACKEND/orders'),
  getById: (id) => api.get(`/BACKEND/orders/${id}`),
};

export default api;
