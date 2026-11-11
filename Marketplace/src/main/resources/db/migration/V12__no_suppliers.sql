-- Sellers buy their own stock and pay for it on the spot: no supplier accounts, nothing owed to a supplier.
-- The only accounts left are customers who buy on due.

ALTER TABLE purchases DROP COLUMN supplier_id; -- takes its credit CHECK with it
ALTER TABLE purchases DROP COLUMN paid;        -- a purchase is paid in full: total is the money out

DELETE FROM party_payments WHERE party_id IN (SELECT id FROM parties WHERE kind = 'SUPPLIER');
DELETE FROM parties WHERE kind = 'SUPPLIER';
ALTER TABLE parties DROP COLUMN kind;          -- takes uq_parties_phone and idx_parties_seller with it

ALTER TABLE parties RENAME TO customers;
ALTER TABLE party_payments RENAME TO customer_payments;
ALTER TABLE customer_payments RENAME COLUMN party_id TO customer_id;
ALTER INDEX idx_party_payments_party RENAME TO idx_customer_payments_customer;

CREATE UNIQUE INDEX uq_customers_phone ON customers (seller_id, phone);
CREATE INDEX idx_customers_seller ON customers (seller_id);

-- A seller can remove a product from the shop. The row stays (orders, sales and the stock register point to it), hidden.
ALTER TABLE listings ADD COLUMN deleted_at TIMESTAMPTZ;
