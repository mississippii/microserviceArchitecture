-- Marketplace initial schema. Rules live in the DB (CHECK / UNIQUE / FK) so no code path can bypass them.
CREATE EXTENSION IF NOT EXISTS postgis;

-- ========== auth ==========
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    phone         VARCHAR(20)  NOT NULL UNIQUE,
    name          VARCHAR(100) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('CUSTOMER', 'SELLER', 'ADMIN', 'VERIFIER')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ========== seller ==========
CREATE TABLE sellers (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT       NOT NULL UNIQUE REFERENCES users (id),
    shop_name         VARCHAR(150) NOT NULL,
    address           VARCHAR(300) NOT NULL,
    lat               DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90 AND 90),
    lng               DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN -180 AND 180),
    -- derived by the DB from lat/lng; used for "nearest seller" queries
    location          GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS
                          (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) STORED,
    delivery_radius_m INT          NOT NULL DEFAULT 5000 CHECK (delivery_radius_m BETWEEN 100 AND 100000),
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'SUSPENDED')),
    quality_score     NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_sellers_location ON sellers USING GIST (location);

-- ========== verification ==========
CREATE TABLE verification_requests (
    id           BIGSERIAL PRIMARY KEY,
    seller_id    BIGINT       NOT NULL REFERENCES sellers (id),
    document_url VARCHAR(500) NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewer_id  BIGINT REFERENCES users (id),
    note         VARCHAR(500),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ========== catalog ==========
CREATE TABLE categories (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- A product is the shared, comparable thing ("Rajshahi Mango - Himsagar, 1kg").
CREATE TABLE products (
    id            BIGSERIAL PRIMARY KEY,
    category_id   BIGINT       NOT NULL REFERENCES categories (id),
    name          VARCHAR(200) NOT NULL,
    description   VARCHAR(2000),
    origin_region VARCHAR(100),
    image_url     VARCHAR(500),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- A listing is one seller's offer of a product: price + stock. Many sellers -> one product = comparison.
CREATE TABLE listings (
    id          BIGSERIAL PRIMARY KEY,
    seller_id   BIGINT         NOT NULL REFERENCES sellers (id),
    product_id  BIGINT         NOT NULL REFERENCES products (id),
    price       NUMERIC(12, 2) NOT NULL CHECK (price > 0),
    stock       INT            NOT NULL CHECK (stock >= 0),
    source_note VARCHAR(500),  -- where this batch came from (trust / traceability)
    active      BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
    UNIQUE (seller_id, product_id)
);
CREATE INDEX idx_listings_product ON listings (product_id) WHERE active;

-- ========== order ==========
-- One order = one seller (a cart with items from 3 sellers becomes 3 orders).
CREATE TABLE orders (
    id               BIGSERIAL PRIMARY KEY,
    customer_id      BIGINT         NOT NULL REFERENCES users (id),
    seller_id        BIGINT         NOT NULL REFERENCES sellers (id),
    status           VARCHAR(20)    NOT NULL DEFAULT 'PLACED'
                         CHECK (status IN ('PLACED', 'ACCEPTED', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    total            NUMERIC(12, 2) NOT NULL CHECK (total > 0),
    delivery_address VARCHAR(300)   NOT NULL,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_customer ON orders (customer_id);
CREATE INDEX idx_orders_seller ON orders (seller_id);

CREATE TABLE order_items (
    id         BIGSERIAL PRIMARY KEY,
    order_id   BIGINT         NOT NULL REFERENCES orders (id),
    listing_id BIGINT         NOT NULL REFERENCES listings (id),
    quantity   INT            NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price > 0)  -- price snapshot at order time
);

-- ========== payment ==========
CREATE TABLE payments (
    id          BIGSERIAL PRIMARY KEY,
    order_id    BIGINT         NOT NULL UNIQUE REFERENCES orders (id),
    method      VARCHAR(20)    NOT NULL CHECK (method IN ('COD', 'BKASH', 'NAGAD', 'CARD')),
    -- HELD = escrow: customer paid, seller not yet paid out
    status      VARCHAR(20)    NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'HELD', 'RELEASED', 'REFUNDED')),
    amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    gateway_ref VARCHAR(100),
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- ========== review ==========
CREATE TABLE reviews (
    id          BIGSERIAL PRIMARY KEY,
    order_id    BIGINT      NOT NULL UNIQUE REFERENCES orders (id), -- one review per order = verified purchase only
    customer_id BIGINT      NOT NULL REFERENCES users (id),
    seller_id   BIGINT      NOT NULL REFERENCES sellers (id),
    rating      SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     VARCHAR(1000),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reviews_seller ON reviews (seller_id);
