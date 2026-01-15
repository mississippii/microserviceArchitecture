// API Endpoints - Maps to your microservices via API Gateway
export const API_ENDPOINTS = {
  // Security Service
  AUTH: {
    LOGIN: '/SECURITY/auth/login',
    REGISTER: '/SECURITY/auth/register',
    LOGOUT: '/SECURITY/auth/logout',
    REFRESH: '/SECURITY/auth/refresh',
    PROFILE: '/SECURITY/user/profile',
    UPDATE_PROFILE: '/SECURITY/user/profile',
  },

  // Backend Service - Products
  PRODUCTS: {
    BASE: '/BACKEND/products',
    BY_ID: (id) => `/BACKEND/products/${id}`,
    BY_CATEGORY: (category) => `/BACKEND/products/category/${category}`,
    BY_SUBCATEGORY: (category, subcategory) =>
      `/BACKEND/products/category/${category}/${subcategory}`,
    SEARCH: '/BACKEND/products/search',
    FEATURED: '/BACKEND/products/featured',
    NEW_ARRIVALS: '/BACKEND/products/new-arrivals',
    BESTSELLERS: '/BACKEND/products/bestsellers',
  },

  // Categories
  CATEGORIES: {
    BASE: '/BACKEND/categories',
    BY_ID: (id) => `/BACKEND/categories/${id}`,
  },

  // Cart
  CART: {
    BASE: '/BACKEND/cart',
    ITEMS: '/BACKEND/cart/items',
    ITEM: (id) => `/BACKEND/cart/items/${id}`,
    CLEAR: '/BACKEND/cart/clear',
  },

  // Orders
  ORDERS: {
    BASE: '/BACKEND/orders',
    BY_ID: (id) => `/BACKEND/orders/${id}`,
    TRACK: (id) => `/BACKEND/orders/${id}/track`,
  },

  // Wishlist
  WISHLIST: {
    BASE: '/BACKEND/wishlist',
    ADD: '/BACKEND/wishlist/add',
    REMOVE: (id) => `/BACKEND/wishlist/${id}`,
  },
};

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};
