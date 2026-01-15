import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Laptop,
  Shirt,
  Watch,
  Home,
  Dumbbell,
  Sparkles,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { CATEGORIES } from '../../constants/categories';

const iconMap = {
  Laptop: Laptop,
  Shirt: Shirt,
  Watch: Watch,
  Home: Home,
  Dumbbell: Dumbbell,
  Sparkles: Sparkles,
};

export default function CategoryMenu({ isMobile = false }) {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]?.id);
  const [expandedMobile, setExpandedMobile] = useState(null);

  const activeCategoryData = CATEGORIES.find((cat) => cat.id === activeCategory);

  // Mobile accordion view
  if (isMobile) {
    return (
      <div className="space-y-1">
        <h3 className="font-semibold text-gray-900 px-2 py-2">Categories</h3>
        {CATEGORIES.map((category) => {
          const Icon = iconMap[category.icon] || Laptop;
          const isExpanded = expandedMobile === category.id;

          return (
            <div key={category.id} className="border-b border-gray-100 last:border-0">
              <button
                onClick={() => setExpandedMobile(isExpanded ? null : category.id)}
                className="flex items-center justify-between w-full px-2 py-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-indigo-600" />
                  <span className="font-medium text-gray-900">{category.name}</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isExpanded && (
                <div className="pl-10 pb-3 space-y-1">
                  <Link
                    to={`/products?category=${category.id}`}
                    className="block py-2 text-indigo-600 font-medium"
                  >
                    View All {category.name}
                  </Link>
                  {category.subcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      to={`/products?category=${category.id}&subcategory=${sub.id}`}
                      className="block py-2 text-gray-600 hover:text-indigo-600"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Desktop mega menu
  return (
    <div className="absolute top-full left-0 mt-0 w-[800px] bg-white rounded-b-xl shadow-xl border border-t-0 z-50">
      <div className="flex">
        {/* Category list - Left side */}
        <div className="w-64 bg-gray-50 rounded-bl-xl py-4">
          {CATEGORIES.map((category) => {
            const Icon = iconMap[category.icon] || Laptop;
            const isActive = activeCategory === category.id;

            return (
              <button
                key={category.id}
                onMouseEnter={() => setActiveCategory(category.id)}
                className={`
                  flex items-center justify-between w-full px-4 py-3 text-left
                  transition-colors
                  ${isActive ? 'bg-white text-indigo-600' : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <span className="font-medium">{category.name}</span>
                </div>
                <ChevronRight className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
              </button>
            );
          })}
        </div>

        {/* Subcategories - Right side */}
        <div className="flex-1 p-6">
          {activeCategoryData && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {activeCategoryData.name}
                </h3>
                <Link
                  to={`/products?category=${activeCategoryData.id}`}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View All →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {activeCategoryData.subcategories.map((sub) => (
                  <Link
                    key={sub.id}
                    to={`/products?category=${activeCategoryData.id}&subcategory=${sub.id}`}
                    className="text-gray-600 hover:text-indigo-600 py-1.5 transition-colors"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>

              {/* Featured banner */}
              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                <p className="text-white font-semibold">Up to 50% Off</p>
                <p className="text-indigo-100 text-sm">On selected {activeCategoryData.name.toLowerCase()}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
