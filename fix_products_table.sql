-- Fix products table - Add is_active column if missing
-- Run this in Supabase SQL Editor

-- Check if is_active column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'products'
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to products table';
    ELSE
        RAISE NOTICE 'is_active column already exists';
    END IF;
END $$;

-- Check if is_featured column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'products'
        AND column_name = 'is_featured'
    ) THEN
        ALTER TABLE products ADD COLUMN is_featured BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_featured column to products table';
    ELSE
        RAISE NOTICE 'is_featured column already exists';
    END IF;
END $$;

-- Verify the columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
