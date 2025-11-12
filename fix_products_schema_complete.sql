-- Comprehensive Products Table Fix
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add slug column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'slug'
    ) THEN
        ALTER TABLE products ADD COLUMN slug VARCHAR(200) UNIQUE;
        RAISE NOTICE 'Added slug column';
    END IF;
END $$;

-- Add description column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'description'
    ) THEN
        ALTER TABLE products ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column';
    END IF;
END $$;

-- Add category_id column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE products ADD COLUMN category_id UUID;
        RAISE NOTICE 'Added category_id column';
    END IF;
END $$;

-- Add price column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'price'
    ) THEN
        ALTER TABLE products ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added price column';
    END IF;
END $$;

-- Add cost column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'cost'
    ) THEN
        ALTER TABLE products ADD COLUMN cost DECIMAL(10,2);
        RAISE NOTICE 'Added cost column';
    END IF;
END $$;

-- Add compare_at_price column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'compare_at_price'
    ) THEN
        ALTER TABLE products ADD COLUMN compare_at_price DECIMAL(10,2);
        RAISE NOTICE 'Added compare_at_price column';
    END IF;
END $$;

-- Add currency column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'currency'
    ) THEN
        ALTER TABLE products ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';
        RAISE NOTICE 'Added currency column';
    END IF;
END $$;

-- Add stock_quantity column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'stock_quantity'
    ) THEN
        ALTER TABLE products ADD COLUMN stock_quantity INT DEFAULT 0;
        RAISE NOTICE 'Added stock_quantity column';
    END IF;
END $$;

-- Add low_stock_threshold column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'low_stock_threshold'
    ) THEN
        ALTER TABLE products ADD COLUMN low_stock_threshold INT DEFAULT 10;
        RAISE NOTICE 'Added low_stock_threshold column';
    END IF;
END $$;

-- Add weight column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'weight'
    ) THEN
        ALTER TABLE products ADD COLUMN weight DECIMAL(10,3);
        RAISE NOTICE 'Added weight column';
    END IF;
END $$;

-- Add dimensions column (JSONB)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'dimensions'
    ) THEN
        ALTER TABLE products ADD COLUMN dimensions JSONB;
        RAISE NOTICE 'Added dimensions column';
    END IF;
END $$;

-- Add images column (JSONB)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'images'
    ) THEN
        ALTER TABLE products ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added images column';
    END IF;
END $$;

-- Add features column (JSONB)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'features'
    ) THEN
        ALTER TABLE products ADD COLUMN features JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added features column';
    END IF;
END $$;

-- Add specifications column (JSONB)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'specifications'
    ) THEN
        ALTER TABLE products ADD COLUMN specifications JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added specifications column';
    END IF;
END $$;

-- Add is_active column (CRITICAL)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column';
    END IF;
END $$;

-- Add is_featured column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'is_featured'
    ) THEN
        ALTER TABLE products ADD COLUMN is_featured BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_featured column';
    END IF;
END $$;

-- Add meta_title column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'meta_title'
    ) THEN
        ALTER TABLE products ADD COLUMN meta_title VARCHAR(255);
        RAISE NOTICE 'Added meta_title column';
    END IF;
END $$;

-- Add meta_description column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'meta_description'
    ) THEN
        ALTER TABLE products ADD COLUMN meta_description TEXT;
        RAISE NOTICE 'Added meta_description column';
    END IF;
END $$;

-- Generate slugs for existing products that don't have one
UPDATE products
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Make slug NOT NULL after generating slugs
ALTER TABLE products ALTER COLUMN slug SET NOT NULL;

-- Verify all columns
SELECT 'Products table structure:' as info;
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
