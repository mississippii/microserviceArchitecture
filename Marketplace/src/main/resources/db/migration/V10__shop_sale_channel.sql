-- Offline = walk-in at the counter (buyer optional); online = a known buyer, phone and name required.
ALTER TABLE shop_sales ADD COLUMN channel VARCHAR(10) NOT NULL DEFAULT 'OFFLINE'
    CHECK (channel IN ('OFFLINE', 'ONLINE'));
