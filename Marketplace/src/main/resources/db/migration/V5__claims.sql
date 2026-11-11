-- "Not original? Full refund": a customer's claim against a delivered order, decided by staff.
CREATE TABLE claims (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT        NOT NULL UNIQUE REFERENCES orders (id), -- one claim per order
    customer_id     BIGINT        NOT NULL REFERENCES users (id),
    seller_id       BIGINT        NOT NULL REFERENCES sellers (id),
    reason          VARCHAR(20)   NOT NULL CHECK (reason IN ('NOT_ORIGINAL', 'NOT_AS_DESCRIBED', 'DAMAGED')),
    details         VARCHAR(1000) NOT NULL,
    evidence_url    VARCHAR(500),
    status          VARCHAR(20)   NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'REFUNDED', 'REJECTED')),
    resolution_note VARCHAR(500),
    reviewer_id     BIGINT REFERENCES users (id),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    resolved_at     TIMESTAMPTZ,
    CHECK ((status = 'OPEN') = (resolved_at IS NULL))
);
CREATE INDEX idx_claims_seller ON claims (seller_id);
CREATE INDEX idx_claims_open ON claims (id) WHERE status = 'OPEN';
