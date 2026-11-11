-- Each category tile shows a mix of its items (composed from the product cut-outs), not one product.
-- Only replaces the single photos set by V13/V14, so a photo an admin chose is kept.
UPDATE categories c SET image_url = v.mix
FROM (VALUES
    ('Fruits', '/products/banana.webp', '/categories/fruits.webp'),
    ('Vegetables', '/products/tomato.webp', '/categories/vegetables.webp'),
    ('Fish', '/products/hilsa.webp', '/categories/fish.webp'),
    ('Spices', '/products/cinnamon.webp', '/categories/spices.webp'),
    ('Grocery', '/products/rice.webp', '/categories/grocery.webp'),
    ('Baby Care', '/products/baby_lotion.webp', '/categories/baby-care.webp')
) AS v(name, single, mix)
WHERE c.name = v.name AND c.image_url = v.single;
