-- Seller identity + payout account, customer dashboard (addresses, cart, order timeline),
-- commission + settlements, stock history, expenses, product requests, notifications, audit log.

-- ========== seller: NID + where to pay the seller ==========
ALTER TABLE sellers
    ADD COLUMN nid_number              VARCHAR(17),
    ADD COLUMN mobile_banking_provider VARCHAR(10),
    ADD COLUMN mobile_banking_number   VARCHAR(11),
    ADD COLUMN bank_name               VARCHAR(100),
    ADD COLUMN bank_account_name       VARCHAR(100),
    ADD COLUMN bank_account_number     VARCHAR(30),
    ADD COLUMN bank_branch             VARCHAR(100);

-- Shops created before this rule existed get placeholders they must replace (visible as 0000… in the Seller Centre).
UPDATE sellers s
SET nid_number              = lpad(s.id::text, 10, '0'),
    mobile_banking_provider = 'BKASH',
    mobile_banking_number   = COALESCE((SELECT u.phone FROM users u WHERE u.id = s.user_id), '01700000000');

ALTER TABLE sellers
    ALTER COLUMN nid_number SET NOT NULL,
    ADD CONSTRAINT sellers_nid_unique UNIQUE (nid_number),
    ADD CONSTRAINT sellers_nid_format CHECK (nid_number ~ '^(\d{10}|\d{13}|\d{17})$'),
    ADD CONSTRAINT sellers_mobile_provider CHECK (mobile_banking_provider IN ('BKASH', 'NAGAD', 'ROCKET')),
    ADD CONSTRAINT sellers_mobile_pair CHECK ((mobile_banking_provider IS NULL) = (mobile_banking_number IS NULL)),
    ADD CONSTRAINT sellers_mobile_format CHECK (mobile_banking_number ~ '^01[3-9]\d{8}$'),
    ADD CONSTRAINT sellers_bank_complete CHECK (
        (bank_account_number IS NULL AND bank_name IS NULL AND bank_account_name IS NULL)
        OR (bank_account_number IS NOT NULL AND bank_name IS NOT NULL AND bank_account_name IS NOT NULL)),
    -- mobile banking, a bank account, or both
    ADD CONSTRAINT sellers_payout_required CHECK (mobile_banking_number IS NOT NULL OR bank_account_number IS NOT NULL);

-- ========== customer: saved addresses + cart ==========
CREATE TABLE addresses (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT       NOT NULL REFERENCES users (id),
    label          VARCHAR(30)  NOT NULL,
    recipient_name VARCHAR(100) NOT NULL,
    phone          VARCHAR(11)  NOT NULL CHECK (phone ~ '^01[3-9]\d{8}$'),
    address        VARCHAR(300) NOT NULL,
    is_default     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_addresses_user ON addresses (user_id);
CREATE UNIQUE INDEX idx_addresses_one_default ON addresses (user_id) WHERE is_default;

CREATE TABLE cart_items (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users (id),
    listing_id BIGINT      NOT NULL REFERENCES listings (id),
    quantity   INT         NOT NULL CHECK (quantity BETWEEN 1 AND 1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, listing_id)
);

-- ========== orders: who receives it, commission snapshot, timeline ==========
ALTER TABLE categories ADD COLUMN commission_rate NUMERIC(4, 2) NOT NULL DEFAULT 8 CHECK (commission_rate BETWEEN 0 AND 30);

-- Money the platform and a seller settled between them. Positive = platform paid the seller,
-- negative = seller paid the platform (cash-on-delivery commission and refunded orders).
CREATE TABLE payouts (
    id          BIGSERIAL PRIMARY KEY,
    seller_id   BIGINT         NOT NULL REFERENCES sellers (id),
    amount      NUMERIC(12, 2) NOT NULL,
    order_count INT            NOT NULL CHECK (order_count > 0),
    reference   VARCHAR(100)   NOT NULL, -- bKash TrxID, bank reference, receipt number
    created_by  BIGINT         NOT NULL REFERENCES users (id),
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_payouts_seller ON payouts (seller_id);

ALTER TABLE orders
    ADD COLUMN recipient_name    VARCHAR(100),
    ADD COLUMN recipient_phone   VARCHAR(11),
    ADD COLUMN commission_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (commission_amount >= 0), -- snapshot at order time
    ADD COLUMN payout_id         BIGINT REFERENCES payouts (id);
UPDATE orders SET commission_amount = round(total * 0.08, 2);
CREATE INDEX idx_orders_unsettled ON orders (seller_id) WHERE payout_id IS NULL;

CREATE TABLE order_events (
    id         BIGSERIAL PRIMARY KEY,
    order_id   BIGINT      NOT NULL REFERENCES orders (id),
    status     VARCHAR(20) NOT NULL CHECK (status IN ('PLACED', 'ACCEPTED', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    actor_id   BIGINT REFERENCES users (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_events_order ON order_events (order_id);
INSERT INTO order_events (order_id, status, actor_id, created_at) SELECT id, 'PLACED', customer_id, created_at FROM orders;
INSERT INTO order_events (order_id, status) SELECT id, status FROM orders WHERE status <> 'PLACED';

-- ========== seller business: cost price, stock history, expenses ==========
ALTER TABLE listings ADD COLUMN cost_price NUMERIC(12, 2) CHECK (cost_price >= 0); -- what the seller paid per unit (private)
ALTER TABLE order_items ADD COLUMN unit_cost NUMERIC(12, 2);                        -- cost snapshot, for profit

CREATE TABLE stock_movements (
    id         BIGSERIAL PRIMARY KEY,
    listing_id BIGINT      NOT NULL REFERENCES listings (id),
    change     INT         NOT NULL CHECK (change <> 0),
    reason     VARCHAR(20) NOT NULL CHECK (reason IN ('RESTOCK', 'ADJUSTMENT', 'SALE', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stock_movements_listing ON stock_movements (listing_id);

CREATE TABLE expenses (
    id         BIGSERIAL PRIMARY KEY,
    seller_id  BIGINT         NOT NULL REFERENCES sellers (id),
    category   VARCHAR(20)    NOT NULL CHECK (category IN ('RENT', 'TRANSPORT', 'PACKAGING', 'SALARY', 'UTILITIES', 'MARKETING', 'OTHER')),
    amount     NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    note       VARCHAR(200),
    spent_on   DATE           NOT NULL,
    created_at TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_expenses_seller ON expenses (seller_id, spent_on);

-- A seller asks for a product that is missing from the shared catalogue.
CREATE TABLE product_requests (
    id          BIGSERIAL PRIMARY KEY,
    seller_id   BIGINT       NOT NULL REFERENCES sellers (id),
    name        VARCHAR(200) NOT NULL,
    category_id BIGINT REFERENCES categories (id),
    note        VARCHAR(500),
    status      VARCHAR(20)  NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    product_id  BIGINT REFERENCES products (id), -- set when approved
    admin_note  VARCHAR(500),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ========== everyone: notifications; staff: audit trail ==========
CREATE TABLE notifications (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users (id),
    title      VARCHAR(150) NOT NULL,
    body       VARCHAR(500),
    link       VARCHAR(200),
    read_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications (user_id, id DESC);

CREATE TABLE audit_log (
    id         BIGSERIAL PRIMARY KEY,
    actor_id   BIGINT       NOT NULL REFERENCES users (id),
    action     VARCHAR(50)  NOT NULL,
    entity     VARCHAR(30)  NOT NULL,
    entity_id  BIGINT       NOT NULL,
    details    VARCHAR(500),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON audit_log (entity, entity_id);
