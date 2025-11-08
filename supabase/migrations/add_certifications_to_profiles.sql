-- Add certifications field to profiles table
-- This will store an array of certification documents with metadata

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;

-- Add a comment to describe the structure
COMMENT ON COLUMN profiles.certifications IS 'Array of certification objects: [{name: string, url: string, size: number, type: string}]';

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_certifications ON profiles USING GIN (certifications);
