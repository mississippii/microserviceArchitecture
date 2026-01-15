export const CATEGORIES = [
  {
    id: 'electronics',
    name: 'Electronics',
    icon: 'Laptop',
    subcategories: [
      { id: 'laptops', name: 'Laptops & Computers' },
      { id: 'smartphones', name: 'Smartphones' },
      { id: 'tablets', name: 'Tablets' },
      { id: 'cameras', name: 'Cameras & Photography' },
      { id: 'audio', name: 'Audio & Headphones' },
      { id: 'gaming', name: 'Gaming & Consoles' },
      { id: 'wearables', name: 'Smart Wearables' },
    ],
  },
  {
    id: 'fashion',
    name: 'Fashion',
    icon: 'Shirt',
    subcategories: [
      { id: 'men', name: "Men's Clothing" },
      { id: 'women', name: "Women's Clothing" },
      { id: 'kids', name: "Kids' Clothing" },
      { id: 'shoes', name: 'Shoes & Footwear' },
      { id: 'sportswear', name: 'Sportswear' },
      { id: 'winter', name: 'Winter Wear' },
    ],
  },
  {
    id: 'accessories',
    name: 'Accessories',
    icon: 'Watch',
    subcategories: [
      { id: 'watches', name: 'Watches' },
      { id: 'bags', name: 'Bags & Luggage' },
      { id: 'jewelry', name: 'Jewelry' },
      { id: 'sunglasses', name: 'Sunglasses & Eyewear' },
      { id: 'belts', name: 'Belts & Wallets' },
      { id: 'hats', name: 'Hats & Caps' },
    ],
  },
  {
    id: 'home',
    name: 'Home & Living',
    icon: 'Home',
    subcategories: [
      { id: 'furniture', name: 'Furniture' },
      { id: 'decor', name: 'Home Decor' },
      { id: 'kitchen', name: 'Kitchen & Dining' },
      { id: 'bedding', name: 'Bedding & Bath' },
      { id: 'lighting', name: 'Lighting' },
      { id: 'storage', name: 'Storage & Organization' },
    ],
  },
  {
    id: 'sports',
    name: 'Sports & Outdoors',
    icon: 'Dumbbell',
    subcategories: [
      { id: 'fitness', name: 'Fitness Equipment' },
      { id: 'outdoor', name: 'Outdoor Recreation' },
      { id: 'cycling', name: 'Cycling' },
      { id: 'camping', name: 'Camping & Hiking' },
      { id: 'team-sports', name: 'Team Sports' },
      { id: 'water-sports', name: 'Water Sports' },
    ],
  },
  {
    id: 'beauty',
    name: 'Beauty & Health',
    icon: 'Sparkles',
    subcategories: [
      { id: 'skincare', name: 'Skincare' },
      { id: 'makeup', name: 'Makeup' },
      { id: 'haircare', name: 'Hair Care' },
      { id: 'fragrance', name: 'Fragrances' },
      { id: 'personal-care', name: 'Personal Care' },
      { id: 'health', name: 'Health & Wellness' },
    ],
  },
];

export const getFlatCategories = () => {
  return CATEGORIES.flatMap((cat) =>
    cat.subcategories.map((sub) => ({
      ...sub,
      parentId: cat.id,
      parentName: cat.name,
    }))
  );
};

export const getCategoryById = (id) => {
  return CATEGORIES.find((cat) => cat.id === id);
};

export const getSubcategoryById = (categoryId, subcategoryId) => {
  const category = getCategoryById(categoryId);
  return category?.subcategories.find((sub) => sub.id === subcategoryId);
};
