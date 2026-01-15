import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import toast from 'react-hot-toast';

export default function ProductCard({ product, compact = false }) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    toast.success(`${product.name} added to cart`);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toast.success('Added to wishlist');
  };

  // Compact card for horizontal scrolling on mobile
  if (compact) {
    return (
      <Link
        to={`/products/${product.id}`}
        className="flex-shrink-0 w-36 sm:w-44 bg-white rounded-2xl overflow-hidden border border-gray-100 active:scale-[0.98] transition-transform"
      >
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img
            src={product.image || '/placeholder.svg'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.discount > 0 && (
            <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              -{product.discount}%
            </span>
          )}
          <button
            className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm"
            onClick={handleWishlist}
          >
            <Heart className="h-3.5 w-3.5 text-gray-600" />
          </button>
        </div>
        <div className="p-2.5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">{product.category}</p>
          <h3 className="font-medium text-gray-900 text-xs mt-0.5 line-clamp-2 leading-tight">{product.name}</h3>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-bold text-indigo-600">
              ${product.price?.toFixed(2)}
            </span>
            <button
              onClick={handleAddToCart}
              className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg active:bg-indigo-200 transition-colors"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </Link>
    );
  }

  // Full card for grid layouts
  return (
    <Link to={`/products/${product.id}`} className="card-mobile group">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={product.image || '/placeholder.svg'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.discount > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
            -{product.discount}%
          </span>
        )}
        {/* Always visible on mobile, hover on desktop */}
        <button
          className="absolute top-2.5 right-2.5 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm
                     sm:opacity-0 sm:group-hover:opacity-100 transition-opacity active:scale-95"
          onClick={handleWishlist}
        >
          <Heart className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{product.category}</p>
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base mt-1 mb-2 line-clamp-2">{product.name}</h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-bold text-indigo-600">
              ${product.price?.toFixed(2)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs sm:text-sm text-gray-400 line-through">
                ${product.originalPrice?.toFixed(2)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl active:bg-indigo-200 transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </div>
    </Link>
  );
}
