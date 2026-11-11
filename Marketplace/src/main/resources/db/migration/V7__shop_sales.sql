-- Sales the seller makes in the physical shop (walk-in customers). Paid on the spot, no platform commission.
CREATE TABLE shop_sales (
    id             BIGSERIAL PRIMARY KEY,
    seller_id      BIGINT         NOT NULL REFERENCES sellers (id),
    buyer_name     VARCHAR(100),
    buyer_phone    VARCHAR(11) CHECK (buyer_phone ~ '^01[3-9]\d{8}$'),
    payment_method VARCHAR(10)    NOT NULL CHECK (payment_method IN ('CASH', 'BKASH', 'NAGAD', 'ROCKET', 'CARD')),
    total          NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    voided_at      TIMESTAMPTZ, -- entered by mistake: stock went back
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_shop_sales_seller ON shop_sales (seller_id, id DESC);

CREATE TABLE shop_sale_items (
    id         BIGSERIAL PRIMARY KEY,
    sale_id    BIGINT         NOT NULL REFERENCES shop_sales (id),
    listing_id BIGINT         NOT NULL REFERENCES listings (id),
    quantity   INT            NOT NULL CHECK (quantity BETWEEN 1 AND 10000),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0), -- the price agreed at the counter
    unit_cost  NUMERIC(12, 2)                                    -- cost snapshot, for profit
);
CREATE INDEX idx_shop_sale_items_sale ON shop_sale_items (sale_id);

ALTER TABLE stock_movements DROP CONSTRAINT stock_movements_reason_check;
ALTER TABLE stock_movements ADD CONSTRAINT stock_movements_reason_check
    CHECK (reason IN ('RESTOCK', 'ADJUSTMENT', 'SALE', 'CANCELLED', 'SHOP_SALE', 'SHOP_SALE_VOID'));
