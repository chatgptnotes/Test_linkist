-- Printer Email Notification System - Database Migration
-- Run this in your Supabase SQL Editor

-- 1. Create printer_settings table
CREATE TABLE IF NOT EXISTS printer_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  printer_email VARCHAR(255) NOT NULL,
  scheduled_hour INTEGER DEFAULT 18 CHECK (scheduled_hour >= 0 AND scheduled_hour <= 23),
  scheduled_minute INTEGER DEFAULT 0 CHECK (scheduled_minute >= 0 AND scheduled_minute <= 59),
  timezone VARCHAR(50) DEFAULT 'Asia/Dubai',
  is_enabled BOOLEAN DEFAULT TRUE,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Singleton pattern - only one row allowed
CREATE UNIQUE INDEX IF NOT EXISTS idx_printer_settings_singleton ON printer_settings ((TRUE));

-- Trigger for updated_at (reuse existing function if available)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_printer_settings_updated_at ON printer_settings;
CREATE TRIGGER update_printer_settings_updated_at
    BEFORE UPDATE ON printer_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policy for service role access
ALTER TABLE printer_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage printer settings" ON printer_settings;
CREATE POLICY "Service role can manage printer settings" ON printer_settings
  FOR ALL USING (true);

-- 2. Add printer tracking columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS printer_email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS printer_email_sent_at TIMESTAMP WITH TIME ZONE;

-- Index for faster unsent queries
CREATE INDEX IF NOT EXISTS idx_orders_printer_unsent ON orders(printer_email_sent, created_at)
  WHERE printer_email_sent = FALSE;

-- 3. Insert default settings row (optional - will be created on first save)
INSERT INTO printer_settings (printer_email, scheduled_hour, scheduled_minute, timezone, is_enabled)
VALUES ('printer@example.com', 18, 0, 'Asia/Dubai', false)
ON CONFLICT DO NOTHING;

-- Verification queries (run these to check the migration worked)
-- SELECT * FROM printer_settings;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders' AND column_name LIKE 'printer%';
