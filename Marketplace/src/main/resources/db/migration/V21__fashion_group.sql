-- Clothing becomes the Fashion group, with its photo (Web/public/categories/fashion.webp).
UPDATE categories SET name = 'Fashion'
WHERE name = 'Clothing' AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Fashion');
UPDATE categories SET image_url = '/categories/fashion.webp' WHERE name = 'Fashion' AND image_url IS NULL;
INSERT INTO categories (name, image_url)
SELECT 'Fashion', '/categories/fashion.webp' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Fashion');
