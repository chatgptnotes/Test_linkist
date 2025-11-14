-- Migration: Fix card_assets asset_type constraint to allow certifications
-- Issue: Certification uploads were failing with constraint violation error
-- Date: 2025-11-14

-- Drop the existing check constraint
ALTER TABLE public.card_assets
DROP CONSTRAINT IF EXISTS card_assets_asset_type_check;

-- Add updated constraint with 'certification' and 'other' types included
ALTER TABLE public.card_assets
ADD CONSTRAINT card_assets_asset_type_check
CHECK (asset_type IN ('logo', 'photo', 'background', 'qr_code', 'proof', 'certification', 'other'));

-- Verify the constraint was updated
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.card_assets'::regclass
  AND conname = 'card_assets_asset_type_check';
