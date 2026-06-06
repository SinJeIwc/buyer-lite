-- Add favorite and blocked flags to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;
