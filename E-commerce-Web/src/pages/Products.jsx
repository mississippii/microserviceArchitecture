import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, X, ChevronDown, Search } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import { PageLoading } from '../components/common/Loading';
import { CATEGORIES, getCategoryById } from '../constants/categories';
import { SORT_OPTIONS } from '../constants/config';
import { Button } from '../components/ui';

// Mock products - replace with API call
const mockProducts = [
  { id: 1, name: 'Wireless Bluetooth Headphones', price: 99.99, categoryId: 'electronics', subcategoryId: 'audio', image: null },
  { id: 2, name: 'Smart Watch Pro Max', price: 249.99, originalPrice: 299.99, discount: 17, categoryId: 'electronics', subcategoryId: 'wearables', image: null },
  { id: 3, name: 'MacBook Pro 16"', price: 2499.99, categoryId: 'electronics', subcategoryId: 'laptops', image: null },
  { id: 4, name: 'iPhone 15 Pro', price: 999.99, categoryId: 'electronics', subcategoryId: 'smartphones', image: null },
  { id: 5, name: 'Premium Running Shoes', price: 129.99, categoryId: 'sports', subcategoryId: 'fitness', image: null },
  { id: 6, name: 'Yoga Mat Premium', price: 45.99, categoryId: 'sports', subcategoryId: 'fitness', image: null },
  { id: 7, name: 'Mountain Bike Pro', price: 899.99, originalPrice: 1099.99, discount: 18, categoryId: 'sports', subcategoryId: 'cycling', image: null },
  { id: 8, name: 'Leather Laptop Backpack', price: 79.99, categoryId: 'accessories', subcategoryId: 'bags', image: null },
  { id: 9, name: 'Classic Leather Watch', price: 199.99, categoryId: 'accessories', subcategoryId: 'watches', image: null },
  { id: 10, name: 'Designer Sunglasses', price: 159.99, categoryId: 'accessories', subcategoryId: 'sunglasses', image: null },
  { id: 11, name: 'Cotton T-Shirt Pack', price: 49.99, categoryId: 'fashion', subcategoryId: 'men', image: null },
  { id: 12, name: 'Summer Dress Collection', price: 89.99, categoryId: 'fashion', subcategoryId: 'women', image: null },
  { id: 13, name: 'Kids Sneakers', price: 59.99, categoryId: 'fashion', subcategoryId: 'kids', image: null },
  { id: 14, name: 'Modern Desk Lamp', price: 34.99, categoryId: 'home', subcategoryId: 'lighting', image: null },
  { id: 15, name: 'Ergonomic Office Chair', price: 299.99, categoryId: 'home', subcategoryId: 'furniture', image: null },
  { id: 16, name: 'Skincare Essentials Kit', price: 79.99, categoryId: 'beauty', subcategoryId: 'skincare', image: null },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const categoryId = searchParams.get('category') || '';
  const subcategoryId = searchParams.get('subcategory') || '';
  const sort = searchParams.get('sort') || 'newest';
  const search = searchParams.get('search') || '';

  const selectedCategory = categoryId ? getCategoryById(categoryId) : null;

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      let filtered = [...mockProducts];

      if (categoryId) {
        filtered = filtered.filter((p) => p.categoryId === categoryId);
      }

      if (subcategoryId) {
        filtered = filtered.filter((p) => p.subcategoryId === subcategoryId);
      }

      if (search) {
        filtered = filtered.filter((p) =>
          p.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      switch (sort) {
        case 'price-asc':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'name-asc':
          filtered.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'name-desc':
          filtered.sort((a, b) => b.name.localeCompare(a.name));
          break;
        default:
          break;
      }

      setProducts(filtered);
      setLoading(false);
    }, 500);
  }, [categoryId, subcategoryId, sort, search]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    if (key === 'category') {
      newParams.delete('subcategory');
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const getPageTitle = () => {
    if (search) return `Search: "${search}"`;
    if (selectedCategory) {
      const subcategory = selectedCategory.subcategories.find(s => s.id === subcategoryId);
      if (subcategory) return `${selectedCategory.name} - ${subcategory.name}`;
      return selectedCategory.name;
    }
    return 'All Products';
  };

  const activeFilterCount = [categoryId, subcategoryId, search].filter(Boolean).length;

  if (loading) return <PageLoading />;

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      {/* Mobile Header */}
      <div className="sticky top-14 sm:top-0 z-30 bg-white border-b sm:hidden">
        {/* Search bar on mobile */}
        <div className="px-4 py-3">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Category Pills - Horizontal scroll */}
        <div className="flex overflow-x-auto hide-scrollbar px-4 pb-3 gap-2">
          <button
            onClick={() => updateFilter('category', '')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !categoryId
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateFilter('category', cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                categoryId === cat.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Filter & Sort Bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-t bg-gray-50">
          <button
            onClick={() => setShowFilters(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border rounded-xl text-sm font-medium"
          >
            <Filter className="h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowSort(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border rounded-xl text-sm font-medium"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Sort
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Desktop & Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Desktop Header */}
        <div className="hidden sm:flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
            <p className="text-gray-500">{products.length} products found</p>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile Title */}
        <div className="sm:hidden mb-4">
          <h1 className="text-lg font-bold text-gray-900">{getPageTitle()}</h1>
          <p className="text-gray-500 text-sm">{products.length} products</p>
        </div>

        {/* Active Filters - Desktop */}
        {(categoryId || subcategoryId || search) && (
          <div className="hidden sm:flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-gray-500">Active filters:</span>
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                {selectedCategory.name}
                <button onClick={() => updateFilter('category', '')} className="hover:text-indigo-900">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {subcategoryId && selectedCategory && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm">
                {selectedCategory.subcategories.find(s => s.id === subcategoryId)?.name}
                <button onClick={() => updateFilter('subcategory', '')} className="hover:text-purple-900">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">
                "{search}"
                <button onClick={() => updateFilter('search', '')} className="hover:text-gray-900">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-700 ml-2"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-sm border sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <SlidersHorizontal className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Filters</h3>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Category</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="category"
                      checked={!categoryId}
                      onChange={() => updateFilter('category', '')}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-gray-700">All Categories</span>
                  </label>
                  {CATEGORIES.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-3 cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="category"
                        checked={categoryId === cat.id}
                        onChange={() => updateFilter('category', cat.id)}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-gray-700">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Subcategories */}
              {selectedCategory && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Subcategory</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <label className="flex items-center gap-3 cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="subcategory"
                        checked={!subcategoryId}
                        onChange={() => updateFilter('subcategory', '')}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-gray-700">All {selectedCategory.name}</span>
                    </label>
                    {selectedCategory.subcategories.map((sub) => (
                      <label key={sub.id} className="flex items-center gap-3 cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="subcategory"
                          checked={subcategoryId === sub.id}
                          onChange={() => updateFilter('subcategory', sub.id)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-gray-700">{sub.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <Button className="w-full">Apply Filters</Button>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {products.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      ...product,
                      category: getCategoryById(product.categoryId)?.name || product.categoryId
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16 bg-white rounded-2xl">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 text-sm mb-6">Try adjusting your filters</p>
                <Button onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      {showFilters && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 sm:hidden animate-fade-in"
            onClick={() => setShowFilters(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 sm:hidden animate-slide-up">
            <div className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white px-4 py-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 -mr-2 text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Filter Content */}
              <div className="p-4 space-y-6">
                {/* Categories */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Category</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateFilter('category', '')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        !categoryId ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      All
                    </button>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => updateFilter('category', cat.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          categoryId === cat.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subcategories */}
                {selectedCategory && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Subcategory</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => updateFilter('subcategory', '')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          !subcategoryId ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        All
                      </button>
                      {selectedCategory.subcategories.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => updateFilter('subcategory', sub.id)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            subcategoryId === sub.id ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Range */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Min"
                      className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3 safe-bottom">
                <button
                  onClick={clearFilters}
                  className="flex-1 py-3.5 border-2 border-gray-200 rounded-xl font-semibold text-gray-700"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Sort Bottom Sheet */}
      {showSort && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 sm:hidden animate-fade-in"
            onClick={() => setShowSort(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 sm:hidden animate-slide-up">
            <div className="bg-white rounded-t-3xl">
              {/* Header */}
              <div className="px-4 py-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">Sort By</h3>
                <button
                  onClick={() => setShowSort(false)}
                  className="p-2 -mr-2 text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Sort Options */}
              <div className="p-2">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      updateFilter('sort', option.value);
                      setShowSort(false);
                    }}
                    className={`w-full text-left px-4 py-4 rounded-xl transition-colors ${
                      sort === option.value
                        ? 'bg-indigo-50 text-indigo-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Safe area */}
              <div className="safe-bottom" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
