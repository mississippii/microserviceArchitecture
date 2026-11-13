-- Batches: every receipt of goods is its own lot, sold oldest first. listings.stock stays the running total (= sum of remaining).
CREATE TABLE stock_batches (
    id         BIGSERIAL PRIMARY KEY,
    listing_id BIGINT         NOT NULL REFERENCES listings (id),
    received   NUMERIC(12, 3) NOT NULL CHECK (received >= 0),
    remaining  NUMERIC(12, 3) NOT NULL CHECK (remaining >= 0),
    unit_cost  NUMERIC(12, 2),
    expires_on DATE,
    created_at TIMESTAMPTZ    NOT NULL DEFAULT now(),
    src        BIGINT -- only for the backfill below
);
CREATE INDEX idx_stock_batches_open ON stock_batches (listing_id, id) WHERE remaining > 0;
CREATE INDEX idx_stock_batches_expiry ON stock_batches (expires_on) WHERE remaining > 0 AND expires_on IS NOT NULL;

-- Which batch each sale took from: gives a shipment its sold quantity and revenue, and puts a cancelled sale back where it came from.
CREATE TABLE stock_allocations (
    id         BIGSERIAL PRIMARY KEY,
    batch_id   BIGINT         NOT NULL REFERENCES stock_batches (id),
    ref_kind   VARCHAR(10)    NOT NULL CHECK (ref_kind IN ('ORDER', 'SHOP_SALE')),
    ref_id     BIGINT         NOT NULL,
    quantity   NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL
);
CREATE INDEX idx_stock_allocations_ref ON stock_allocations (ref_kind, ref_id);
CREATE INDEX idx_stock_allocations_batch ON stock_allocations (batch_id);

ALTER TABLE purchase_items ADD COLUMN batch_id BIGINT REFERENCES stock_batches (id);

-- Backfill. Oldest goes first, so what is on the shelf today sits in the newest shipments.
-- 1) Stock that no live shipment explains (opening stock, corrections) is the oldest batch.
INSERT INTO stock_batches (listing_id, received, remaining, unit_cost)
SELECT l.id, x.extra, x.extra, l.cost_price
FROM listings l
CROSS JOIN LATERAL (SELECT l.stock - COALESCE((SELECT SUM(i.quantity) FROM purchase_items i JOIN purchases p ON p.id = i.purchase_id
                                               WHERE i.listing_id = l.id AND p.cancelled_at IS NULL), 0) AS extra) x
WHERE x.extra > 0
ORDER BY l.id;

-- 2) One batch per shipment line; a deleted shipment's line has nothing left.
INSERT INTO stock_batches (listing_id, received, remaining, unit_cost, created_at, src)
SELECT i.listing_id, i.quantity, COALESCE(live.remaining, 0), i.unit_cost, p.created_at, i.id
FROM purchase_items i
JOIN purchases p ON p.id = i.purchase_id
LEFT JOIN (SELECT i2.id,
                  GREATEST(0, LEAST(i2.quantity, l.stock - COALESCE(SUM(i2.quantity) OVER (PARTITION BY i2.listing_id ORDER BY i2.id DESC
                                                                                           ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0))) AS remaining
           FROM purchase_items i2
           JOIN purchases p2 ON p2.id = i2.purchase_id AND p2.cancelled_at IS NULL
           JOIN listings l ON l.id = i2.listing_id) live ON live.id = i.id
ORDER BY i.id;

UPDATE purchase_items i SET batch_id = b.id FROM stock_batches b WHERE b.src = i.id;
ALTER TABLE stock_batches DROP COLUMN src;
