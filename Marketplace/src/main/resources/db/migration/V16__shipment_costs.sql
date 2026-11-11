-- A cost paid for one shipment (transport, labour…): still an ordinary expense in the accounts, tied to its purchase.
ALTER TABLE expenses ADD COLUMN purchase_id BIGINT REFERENCES purchases (id);
CREATE INDEX idx_expenses_purchase ON expenses (purchase_id);
