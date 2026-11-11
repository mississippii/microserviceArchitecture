-- A variety is a product under another product (আম → হিমসাগর). It stays a full product row, so sellers stock it,
-- customers compare sellers on it, and orders reference it exactly like any other product. One level only.
ALTER TABLE products
    ADD COLUMN parent_id BIGINT REFERENCES products (id),
    ADD CONSTRAINT products_not_own_parent CHECK (parent_id IS NULL OR parent_id <> id);
CREATE INDEX idx_products_parent ON products (parent_id);
