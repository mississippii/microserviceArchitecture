-- Sellers stock and sell by a unit (kg, crate, box, piece…). Loose goods need fractions, so stock is NUMERIC.
ALTER TABLE listings
    ADD COLUMN unit          VARCHAR(10)    NOT NULL DEFAULT 'PCS'
        CHECK (unit IN ('PCS', 'KG', 'LITRE', 'DOZEN', 'BOX', 'CRATE', 'BAG', 'PACK')),
    ADD COLUMN reorder_level NUMERIC(12, 3) CHECK (reorder_level >= 0), -- low-stock alert; null = default
    ALTER COLUMN stock TYPE NUMERIC(12, 3);

-- The stock register: what came in from whom and at what cost, and why a count was corrected.
ALTER TABLE stock_movements
    ALTER COLUMN change TYPE NUMERIC(12, 3),
    ADD COLUMN unit_cost NUMERIC(12, 2) CHECK (unit_cost >= 0),
    ADD COLUMN note      VARCHAR(200);

ALTER TABLE shop_sale_items ALTER COLUMN quantity TYPE NUMERIC(12, 3);
ALTER TABLE shop_sale_items DROP CONSTRAINT shop_sale_items_quantity_check;
ALTER TABLE shop_sale_items ADD CONSTRAINT shop_sale_items_quantity_check CHECK (quantity > 0 AND quantity <= 100000);
