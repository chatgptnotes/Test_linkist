-- Migration: Add temp_user_data column to OTP tables
-- Purpose: Store temporary user registration data until OTP is verified

-- Add temp_user_data JSONB column to email_otps table
ALTER TABLE email_otps
ADD COLUMN IF NOT EXISTS temp_user_data JSONB;

-- Add temp_user_data JSONB column to mobile_otps table
ALTER TABLE mobile_otps
ADD COLUMN IF NOT EXISTS temp_user_data JSONB;

-- Add index for faster JSONB queries (optional, but helpful for debugging)
CREATE INDEX IF NOT EXISTS idx_email_otps_temp_user_data ON email_otps USING GIN (temp_user_data);
CREATE INDEX IF NOT EXISTS idx_mobile_otps_temp_user_data ON mobile_otps USING GIN (temp_user_data);

-- Add comments to explain the columns
COMMENT ON COLUMN email_otps.temp_user_data IS 'Temporary storage for user registration data (firstName, lastName, email, phone) until OTP is verified';
COMMENT ON COLUMN mobile_otps.temp_user_data IS 'Temporary storage for user registration data (firstName, lastName, email, phone) until OTP is verified';

-- Example structure for temp_user_data:
-- {
--   "firstName": "John",
--   "lastName": "Doe",
--   "email": "john@example.com",
--   "phone": "+1234567890"
-- }
