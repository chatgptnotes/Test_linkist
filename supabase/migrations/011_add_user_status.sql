-- Migration: Add status column to users table for managing user lifecycle
-- Purpose: Prevent pre-OTP user creation by tracking user status (pending, active, suspended)

-- Add status column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
CHECK (status IN ('pending', 'active', 'suspended'));

-- Create index for faster status filtering
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Update existing users to 'active' status (they were created before this change)
UPDATE users
SET status = 'active'
WHERE status IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN users.status IS 'User account status: pending (awaiting OTP verification), active (verified and active), suspended (account disabled)';

-- Update RLS policies to only allow active users to authenticate
-- Note: Service role can still access all users for admin operations
DROP POLICY IF EXISTS users_select_own ON users;
CREATE POLICY users_select_own
  ON users
  FOR SELECT
  USING (auth.uid()::text = id::text AND status = 'active');

DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own
  ON users
  FOR UPDATE
  USING (auth.uid()::text = id::text AND status = 'active');

-- Add a default constraint to ensure new users start as pending
-- This will be overridden by application logic but provides a safe default
ALTER TABLE users
ALTER COLUMN status SET DEFAULT 'pending';
