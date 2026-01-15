import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, CreditCard, Clock, Laptop, Shirt, Watch, Home as HomeIcon, Dumbbell, Sparkles, ChevronRight } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import { CATEGORIES } from '../constants/categories';
import { Button } from '../components/ui';

// Mock featured products - replace with API call
const featuredProducts = [
  { id: 1, name: 'Wireless Bluetooth Headphones', price: 99.99, category: 'Electronics', image: null },
  { id: 2, name: 'Smart Watch Pro Max', price: 249.99, originalPrice: 299.99, discount: 17, category: 'Electronics', image: null },
  { id: 3, name: 'Premium Running Shoes', price: 129.99, category: 'Sports', image: null },
  { id: 4, name: 'Leather Laptop Backpack', price: 59.99, category: 'Accessories', image: null },
];

const newArrivals = [
  { id: 5, name: 'Minimalist Desk Lamp', price: 45.99, category: 'Home & Living', image: null },
  { id: 6, name: 'Organic Cotton T-Shirt', price: 34.99, category: 'Fashion', image: null },
  { id: 7, name: 'Wireless Charging Pad', price: 29.99, category: 'Electronics', image: null },
  { id: 8, name: 'Yoga Mat Premium', price: 55.99, originalPrice: 69.99, discount: 20, category: 'Sports', image: null },
];

const iconMap = {
  Laptop: Laptop,
  Shirt: Shirt,
  Watch: Watch,
  Home: HomeIcon,
  Dumbbell: Dumbbell,
  Sparkles: Sparkles,
};

export default function Home() {
  return (
    <div className="pb-16 sm:pb-0">
      {/* Hero Section - Clean & Minimal */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="text-center sm:text-left">
              <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-100 rounded-full text-xs sm:text-sm font-medium text-gray-700 mb-4 sm:mb-6">
                New Season Collection 2026
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                Discover Your
                <span className="block">Perfect Style</span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-6 sm:mb-8 max-w-lg mx-auto sm:mx-0">
                Shop thousands of products from top brands. Enjoy free shipping, easy returns, and exclusive deals.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center sm:justify-start">
                <Link to="/products" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-gray-900 text-white hover:bg-gray-800">
                    Shop Now
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/products?sale=true" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50">
                    View Sale
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex justify-center sm:justify-start gap-8 sm:gap-12 mt-10 sm:mt-12 pt-8 sm:pt-10 border-t border-gray-100">
                <div className="text-center sm:text-left">
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">200+</p>
                  <p className="text-gray-500 text-xs sm:text-sm">Brands</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">50K+</p>
                  <p className="text-gray-500 text-xs sm:text-sm">Products</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">100K+</p>
                  <p className="text-gray-500 text-xs sm:text-sm">Customers</p>
                </div>
              </div>
            </div>

            {/* Hero image placeholder - Desktop only */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="w-full h-[450px] bg-gray-100 rounded-3xl flex items-center justify-center">
                  <span className="text-gray-400 text-lg">Hero Image</span>
                </div>
                <div className="absolute -left-6 top-1/4 bg-white rounded-2xl p-4 shadow-xl border border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">Free Shipping</p>
                  <p className="text-xs text-gray-500">On orders $50+</p>
                </div>
                <div className="absolute -right-6 bottom-1/4 bg-white rounded-2xl p-4 shadow-xl border border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">50% Off</p>
                  <p className="text-xs text-gray-500">Selected items</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Strip - Horizontal scroll on mobile */}
      <section className="bg-white border-b overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Mobile: Horizontal scroll */}
          <div className="flex sm:hidden overflow-x-auto hide-scrollbar py-4 px-4 gap-4">
            <div className="flex items-center gap-3 flex-shrink-0 bg-gray-50 rounded-xl p-3 min-w-[160px]">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Truck className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Free Shipping</h3>
                <p className="text-xs text-gray-500">Orders $50+</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 bg-gray-50 rounded-xl p-3 min-w-[160px]">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Secure Pay</h3>
                <p className="text-xs text-gray-500">100% safe</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 bg-gray-50 rounded-xl p-3 min-w-[160px]">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Easy Returns</h3>
                <p className="text-xs text-gray-500">30 days</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 bg-gray-50 rounded-xl p-3 min-w-[160px]">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">24/7 Support</h3>
                <p className="text-xs text-gray-500">Online help</p>
              </div>
            </div>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0">
            <div className="flex items-center gap-4 p-6">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Truck className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Free Shipping</h3>
                <p className="text-sm text-gray-500">Orders over $50</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6">
              <div className="p-3 bg-green-100 rounded-xl">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Secure Payment</h3>
                <p className="text-sm text-gray-500">100% protected</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6">
              <div className="p-3 bg-orange-100 rounded-xl">
                <CreditCard className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Easy Returns</h3>
                <p className="text-sm text-gray-500">30 day returns</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">24/7 Support</h3>
                <p className="text-sm text-gray-500">Online help</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Category - Horizontal scroll on mobile */}
      <section className="py-8 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Shop by Category</h2>
              <p className="text-gray-500 text-sm sm:text-base hidden sm:block mt-1">
                Browse our wide selection of products
              </p>
            </div>
            <Link
              to="/products"
              className="flex items-center gap-1 text-indigo-600 font-medium text-sm"
            >
              All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile: Horizontal scroll */}
          <div className="flex sm:hidden overflow-x-auto hide-scrollbar -mx-4 px-4 gap-3 pb-2">
            {CATEGORIES.map((category) => {
              const Icon = iconMap[category.icon] || Laptop;
              return (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  className="flex-shrink-0 w-24 text-center active:scale-95 transition-transform"
                >
                  <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center border-2 border-transparent hover:border-indigo-200">
                    <Icon className="h-7 w-7 text-indigo-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-xs leading-tight">{category.name}</h3>
                </Link>
              );
            })}
          </div>

          {/* Desktop: Grid */}
          <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((category) => {
              const Icon = iconMap[category.icon] || Laptop;
              return (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  className="group bg-white rounded-2xl p-6 text-center border-2 border-transparent hover:border-indigo-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                  <p className="text-xs text-gray-500">
                    {category.subcategories.length} subcategories
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products - Horizontal scroll on mobile */}
      <section className="py-8 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-gray-500 text-sm hidden sm:block mt-1">Handpicked products just for you</p>
            </div>
            <Link
              to="/products?featured=true"
              className="flex items-center gap-1 text-indigo-600 font-medium text-sm"
            >
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile: Horizontal scroll */}
          <div className="flex sm:hidden overflow-x-auto hide-scrollbar -mx-4 px-4 gap-3 pb-2">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>

          {/* Desktop: Grid */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banner - Clean design */}
      <section className="py-8 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gray-100 p-6 sm:p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div className="text-center sm:text-left">
                <span className="inline-block px-3 py-1.5 bg-gray-900 text-white rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                  Limited Time
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Summer Sale
                  <br />
                  Up to 50% Off
                </h2>
                <p className="text-gray-600 text-sm sm:text-base mb-5 sm:mb-6">
                  Don't miss out on our biggest sale. Shop your favorites at unbeatable prices.
                </p>
                <Link to="/products?sale=true" className="inline-block w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-gray-900 text-white hover:bg-gray-800">
                    Shop the Sale
                  </Button>
                </Link>
              </div>

              <div className="hidden md:flex justify-center">
                <div className="w-64 h-64 bg-white rounded-3xl flex items-center justify-center shadow-sm">
                  <span className="text-gray-400">Promo Image</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals - Horizontal scroll on mobile */}
      <section className="py-8 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">New Arrivals</h2>
              <p className="text-gray-500 text-sm hidden sm:block mt-1">Check out the latest products</p>
            </div>
            <Link
              to="/products?sort=newest"
              className="flex items-center gap-1 text-indigo-600 font-medium text-sm"
            >
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile: Horizontal scroll */}
          <div className="flex sm:hidden overflow-x-auto hide-scrollbar -mx-4 px-4 gap-3 pb-2">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>

          {/* Desktop: Grid */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
