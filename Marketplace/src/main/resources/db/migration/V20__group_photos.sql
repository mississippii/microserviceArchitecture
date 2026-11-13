-- New group photos (Web/public/categories). Baby Care and Spices keep their file names, so only the files changed.
-- The fish photo now shows meat too, so the group is named for both; and handicrafts get a group of their own.
UPDATE categories SET name = 'Meat & Fish'
WHERE name = 'Fish' AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Meat & Fish');

INSERT INTO categories (name, image_url)
SELECT 'Artisan Craft', '/categories/artisan-craft.webp'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Artisan Craft');
