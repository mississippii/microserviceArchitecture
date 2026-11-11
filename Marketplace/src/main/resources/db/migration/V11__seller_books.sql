-- The seller's own books: customers who buy on credit, suppliers they buy from, purchases and payments.
-- Balances are never stored: they are summed from these rows, so they can't drift.

CREATE TABLE parties (
    id              BIGSERIAL PRIMARY KEY,
    seller_id       BIGINT         NOT NULL REFERENCES sellers (id),
    kind            VARCHAR(10)    NOT NULL CHECK (kind IN ('CUSTOMER', 'SUPPLIER')),
    name            VARCHAR(100)   NOT NULL,
    phone           VARCHAR(11) CHECK (phone ~ '^01[3-9]\d{8}$'),
    address         VARCHAR(300),
    -- owed before the books started: a customer owes the shop / the shop owes a supplier (negative = advance)
    opening_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_parties_phone ON parties (seller_id, kind, phone);
CREATE INDEX idx_parties_seller ON parties (seller_id, kind);

-- One payment-method list for every money row the seller records.
ALTER TABLE shop_sales DROP CONSTRAINT shop_sales_payment_method_check;
ALTER TABLE shop_sales ADD CONSTRAINT shop_sales_payment_method_check
    CHECK (payment_method IN ('CASH', 'BKASH', 'NAGAD', 'ROCKET', 'CARD', 'BANK'));

-- Stock bought from a supplier (or the market). Unpaid part = owed to the supplier.
CREATE TABLE purchases (
    id             BIGSERIAL PRIMARY KEY,
    seller_id      BIGINT         NOT NULL REFERENCES sellers (id),
    supplier_id    BIGINT REFERENCES parties (id),
    total          NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    paid           NUMERIC(12, 2) NOT NULL CHECK (paid >= 0),
    payment_method VARCHAR(10)    NOT NULL CHECK (payment_method IN ('CASH', 'BKASH', 'NAGAD', 'ROCKET', 'CARD', 'BANK')),
    note           VARCHAR(200),
    cancelled_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CHECK (paid <= total),
    CHECK (supplier_id IS NOT NULL OR paid = total) -- buying on credit needs a supplier account
);
CREATE INDEX idx_purchases_seller ON purchases (seller_id, id DESC);

CREATE TABLE purchase_items (
    id          BIGSERIAL PRIMARY KEY,
    purchase_id BIGINT         NOT NULL REFERENCES purchases (id),
    listing_id  BIGINT         NOT NULL REFERENCES listings (id),
    quantity    NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    unit_cost   NUMERIC(12, 2) NOT NULL CHECK (unit_cost >= 0)
);
CREATE INDEX idx_purchase_items_purchase ON purchase_items (purchase_id);

-- Money a customer paid the shop, or the shop paid a supplier, outside a sale or purchase.
CREATE TABLE party_payments (
    id             BIGSERIAL PRIMARY KEY,
    seller_id      BIGINT         NOT NULL REFERENCES sellers (id),
    party_id       BIGINT         NOT NULL REFERENCES parties (id),
    amount         NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(10)    NOT NULL CHECK (payment_method IN ('CASH', 'BKASH', 'NAGAD', 'ROCKET', 'CARD', 'BANK')),
    note           VARCHAR(200),
    voided_at      TIMESTAMPTZ,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_party_payments_party ON party_payments (party_id);

-- Shop sales: a discount, and a customer who may pay part now and the rest later.
ALTER TABLE shop_sales
    ADD COLUMN customer_id BIGINT REFERENCES parties (id),
    ADD COLUMN discount    NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    ADD COLUMN paid        NUMERIC(12, 2);
UPDATE shop_sales SET paid = total;
ALTER TABLE shop_sales
    ALTER COLUMN paid SET NOT NULL,
    ADD CONSTRAINT shop_sales_paid CHECK (paid >= 0 AND paid <= total),
    ADD CONSTRAINT shop_sales_due_needs_customer CHECK (customer_id IS NOT NULL OR paid = total);
CREATE INDEX idx_shop_sales_customer ON shop_sales (customer_id) WHERE customer_id IS NOT NULL;

-- How an expense was paid, so the cash book is complete.
ALTER TABLE expenses ADD COLUMN payment_method VARCHAR(10) NOT NULL DEFAULT 'CASH'
    CHECK (payment_method IN ('CASH', 'BKASH', 'NAGAD', 'ROCKET', 'CARD', 'BANK'));

ALTER TABLE stock_movements DROP CONSTRAINT stock_movements_reason_check;
ALTER TABLE stock_movements ADD CONSTRAINT stock_movements_reason_check
    CHECK (reason IN ('RESTOCK', 'ADJUSTMENT', 'SALE', 'CANCELLED', 'SHOP_SALE', 'SHOP_SALE_VOID', 'PURCHASE_CANCEL'));
