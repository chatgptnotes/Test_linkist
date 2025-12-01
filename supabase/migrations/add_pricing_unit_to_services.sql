-- Migration: Add pricing_unit column to profile_services table
-- Purpose: Store the pricing unit (e.g., "/hour", "/day", "/month") for services

ALTER TABLE profile_services
ADD COLUMN IF NOT EXISTS pricing_unit VARCHAR(20) DEFAULT '';

-- Add comment for documentation
COMMENT ON COLUMN profile_services.pricing_unit IS 'Pricing unit for the service (e.g., /hour, /day, /month, or empty for fixed price)';
