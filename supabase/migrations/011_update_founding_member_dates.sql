-- Update founding member program dates to Nov 2025 - May 2026
-- This migration updates the system settings and LINKISTFM voucher validity dates

-- Update system_settings for founding member program dates
UPDATE system_settings
SET
  value = '"2025-11-01T00:00:00Z"'::jsonb,
  updated_at = NOW()
WHERE key = 'founding_member_launch_date';

UPDATE system_settings
SET
  value = '"2026-05-01T23:59:59Z"'::jsonb,
  updated_at = NOW()
WHERE key = 'founding_member_end_date';

-- Update LINKISTFM voucher validity dates
UPDATE vouchers
SET
  valid_from = '2025-11-01T00:00:00Z'::timestamp with time zone,
  valid_until = '2026-05-01T23:59:59Z'::timestamp with time zone,
  updated_at = NOW()
WHERE code = 'LINKISTFM';

-- Verify the updates
SELECT key, value, updated_at
FROM system_settings
WHERE key IN ('founding_member_launch_date', 'founding_member_end_date');

SELECT code, valid_from, valid_until, is_active, updated_at
FROM vouchers
WHERE code = 'LINKISTFM';
