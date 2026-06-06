-- Add size column to supplier_items and storage_items
ALTER TABLE supplier_items ADD COLUMN IF NOT EXISTS size text;
ALTER TABLE storage_items ADD COLUMN IF NOT EXISTS size text;
