-- Fruits' tile: a clean cut-out (the mango photo has its own grey box). Only if nobody changed it since V13.
UPDATE categories SET image_url = '/products/banana.webp' WHERE name = 'Fruits' AND image_url = '/products/mango.webp';
