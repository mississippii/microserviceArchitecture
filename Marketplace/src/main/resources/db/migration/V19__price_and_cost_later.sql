-- A shipment can be entered with only the products and quantities; cost and selling price come later.
-- A product without a price is never on sale online.
ALTER TABLE listings ALTER COLUMN price DROP NOT NULL;
ALTER TABLE listings ADD CONSTRAINT listings_priced_to_sell CHECK (price IS NOT NULL OR NOT active);
ALTER TABLE purchase_items ALTER COLUMN unit_cost DROP NOT NULL;
