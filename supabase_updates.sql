-- Database Migration & Updates for Vastra Mandir
-- This script contains all schema changes implemented during the UI and System upgrade.

-- 1. Add Category support to Items (Products)
-- Based on your schema, this column is currently missing
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- 2. Add Variant and Multi-item support to Orders
-- This stores the detailed JSON of all items in an order (color, size, quantity)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_items JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_charge INTEGER DEFAULT 0;

-- 3. Create Settings table for Store-wide configuration
-- Used for dynamic UPI ID management
CREATE TABLE IF NOT EXISTS settings (
    id BIGSERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Initial Hardware Seeding
-- Sets the default UPI ID. Can be updated via Admin Panel -> Settings
INSERT INTO settings (key, value) 
VALUES ('upi_id', '7892460628@axl')
ON CONFLICT (key) DO NOTHING;

-- 5. Create Action Logs for Admin Tracking
CREATE TABLE IF NOT EXISTS admin_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_name TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Indexing for Search & Filtering Performance
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_logs_admin ON admin_logs(admin_name);
