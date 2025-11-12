-- Check what columns exist in products table
-- Run this FIRST in Supabase SQL Editor to see what's there

SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
