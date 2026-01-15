import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  User,
  Heart,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Package,
  Settings,
  Home,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';
import { APP_CONFIG } from '../../constants/config';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { isAuthenticated, user, logout } = useAuthStore();
  const cartItemCount = useCartStore((state) => state.getItemCount());

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white safe-top">
        {/* Top promo bar - Hidden on mobile for more space */}
        <div className="hidden sm:block bg-gray-900 text-white text-center py-2 text-sm">
          <p>Free shipping on orders over $50! Use code: <span className="font-bold">FREESHIP</span></p>
        </div>

        {/* Main navbar */}
        <div className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* Logo */}
              <Link to="/" className="flex-shrink-0">
                <span className="text-xl sm:text-2xl font-bold gradient-text">
                  {APP_CONFIG.name}
                </span>
              </Link>

              {/* Search bar - Desktop */}
              <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-full
                             focus:outline-none focus:ring-2 focus:ring-indigo-500
                             focus:bg-white transition-all text-sm"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </form>

              {/* Right section */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Mobile search toggle */}
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="md:hidden p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Search className="h-5 w-5" />
                </button>

                {/* Wishlist - Hidden on mobile (in bottom nav) */}
                <Link
                  to="/wishlist"
                  className="hidden sm:flex p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Heart className="h-5 w-5" />
                </Link>

                {/* Cart */}
                <Link
                  to="/cart"
                  className="relative p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {cartItemCount > 9 ? '9+' : cartItemCount}
                    </span>
                  )}
                </Link>

                {/* User menu - Desktop */}
                {isAuthenticated ? (
                  <div className="relative hidden sm:block">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </button>

                    {isUserMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 py-2 animate-fade-in">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="font-semibold text-gray-900">{user?.name || 'User'}</p>
                            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                          </div>
                          <Link
                            to="/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <User className="h-4 w-4" />
                            My Profile
                          </Link>
                          <Link
                            to="/orders"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Package className="h-4 w-4" />
                            My Orders
                          </Link>
                          <Link
                            to="/settings"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Settings className="h-4 w-4" />
                            Settings
                          </Link>
                          <div className="border-t border-gray-100 my-2" />
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 w-full transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            Logout
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-2">
                    <Link
                      to="/login"
                      className="px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}

                {/* Mobile menu button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="sm:hidden p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile search bar - Expandable */}
        {isSearchOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 p-4 animate-slide-up">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </form>
          </div>
        )}

        {/* Mobile menu - Fullscreen overlay */}
        {isMobileMenuOpen && (
          <div className="sm:hidden fixed inset-0 top-14 bg-white z-40 animate-fade-in overflow-y-auto">
            <div className="p-4 space-y-6 pb-32">
              {/* User section */}
              {isAuthenticated ? (
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl">
                  <div className="h-14 w-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{user?.name || 'User'}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 py-3.5 text-center text-gray-700 border-2 border-gray-200 rounded-xl font-semibold"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 py-3.5 text-center bg-indigo-600 text-white rounded-xl font-semibold"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Navigation */}
              <nav className="space-y-2">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-4 px-4 py-4 text-gray-700 hover:bg-gray-50 rounded-xl font-medium text-lg"
                >
                  <Home className="h-5 w-5" />
                  Home
                </Link>
                <Link
                  to="/products"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-4 px-4 py-4 text-gray-700 hover:bg-gray-50 rounded-xl font-medium text-lg"
                >
                  <Package className="h-5 w-5" />
                  All Products
                </Link>
                <Link
                  to="/wishlist"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-4 px-4 py-4 text-gray-700 hover:bg-gray-50 rounded-xl font-medium text-lg"
                >
                  <Heart className="h-5 w-5" />
                  Wishlist
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      to="/orders"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-4 px-4 py-4 text-gray-700 hover:bg-gray-50 rounded-xl font-medium text-lg"
                    >
                      <Package className="h-5 w-5" />
                      My Orders
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-4 px-4 py-4 text-gray-700 hover:bg-gray-50 rounded-xl font-medium text-lg"
                    >
                      <User className="h-5 w-5" />
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-4 px-4 py-4 text-red-600 hover:bg-red-50 rounded-xl font-medium text-lg w-full"
                    >
                      <LogOut className="h-5 w-5" />
                      Logout
                    </button>
                  </>
                )}
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden bottom-nav">
        <div className="flex items-center justify-around py-2">
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              isActive('/') ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link
            to="/products"
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              isActive('/products') ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            <Search className="h-5 w-5" />
            <span className="text-[10px] font-medium">Explore</span>
          </Link>
          <Link
            to="/cart"
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors relative ${
              isActive('/cart') ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute top-1 right-2 h-4 w-4 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartItemCount > 9 ? '9+' : cartItemCount}
              </span>
            )}
            <span className="text-[10px] font-medium">Cart</span>
          </Link>
          <Link
            to="/wishlist"
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              isActive('/wishlist') ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            <Heart className="h-5 w-5" />
            <span className="text-[10px] font-medium">Wishlist</span>
          </Link>
          <Link
            to={isAuthenticated ? '/profile' : '/login'}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              isActive('/profile') || isActive('/login') ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Account</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
