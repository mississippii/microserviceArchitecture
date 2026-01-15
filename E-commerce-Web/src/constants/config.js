// App Configuration
export const APP_CONFIG = {
  name: 'ShopHub',
  tagline: 'Your One-Stop Shopping Destination',
  currency: 'USD',
  currencySymbol: '$',
  locale: 'en-US',
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  LIMITS: [12, 24, 36, 48],
};

// Sort options for products
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
];

// Price ranges for filtering
export const PRICE_RANGES = [
  { min: 0, max: 25, label: 'Under $25' },
  { min: 25, max: 50, label: '$25 - $50' },
  { min: 50, max: 100, label: '$50 - $100' },
  { min: 100, max: 200, label: '$100 - $200' },
  { min: 200, max: null, label: '$200 & Above' },
];

// Shipping thresholds
export const SHIPPING = {
  FREE_THRESHOLD: 50,
  STANDARD_RATE: 5.99,
  EXPRESS_RATE: 12.99,
};

// Tax rate
export const TAX_RATE = 0.1; // 10%

// Toast messages
export const MESSAGES = {
  CART_ADDED: 'Item added to cart',
  CART_REMOVED: 'Item removed from cart',
  CART_UPDATED: 'Cart updated',
  WISHLIST_ADDED: 'Added to wishlist',
  WISHLIST_REMOVED: 'Removed from wishlist',
  LOGIN_SUCCESS: 'Welcome back!',
  REGISTER_SUCCESS: 'Account created successfully',
  LOGOUT_SUCCESS: 'You have been logged out',
  ERROR_GENERIC: 'Something went wrong. Please try again.',
};
