-- Add currency column to profile_services table
-- This migration adds support for storing currency information for service pricing

-- Add currency column with default value of 'USD'
ALTER TABLE profile_services
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';

-- Add comment to document the column
COMMENT ON COLUMN profile_services.currency IS 'Currency code (ISO 4217) for service pricing. Defaults to USD.';

-- Update any existing records to have USD as the default currency
UPDATE profile_services
SET currency = 'USD'
WHERE currency IS NULL;
