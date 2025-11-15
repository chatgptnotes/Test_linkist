# 🔐 Quick Start Guide - Authentication Fix Deployment

## Overview
This guide will help you deploy the authentication fix that prevents users from being created before OTP verification.

---

## Prerequisites
- Access to Supabase dashboard or database
- Supabase project URL and service role key
- Database admin credentials

---

## Step 1: Run Database Migrations (REQUIRED)

### Option A: Using Supabase Dashboard (Recommended)

1. Open your Supabase dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**

#### Run Migration 1: Add Status Column
```sql
-- Copy and paste the entire contents of:
-- supabase/migrations/011_add_user_status.sql

-- OR paste this directly:
ALTER TABLE users
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
CHECK (status IN ('pending', 'active', 'suspended'));

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

UPDATE users
SET status = 'active'
WHERE status IS NULL;

COMMENT ON COLUMN users.status IS 'User account status: pending (awaiting OTP verification), active (verified and active), suspended (account disabled)';

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

ALTER TABLE users
ALTER COLUMN status SET DEFAULT 'pending';
```

4. Click **Run** and verify success

5. Click **New Query** again

#### Run Migration 2: Add Temp User Data Column
```sql
-- Copy and paste the entire contents of:
-- supabase/migrations/012_add_otp_temp_user_data.sql

-- OR paste this directly:
ALTER TABLE email_otps
ADD COLUMN IF NOT EXISTS temp_user_data JSONB;

ALTER TABLE mobile_otps
ADD COLUMN IF NOT EXISTS temp_user_data JSONB;

CREATE INDEX IF NOT EXISTS idx_email_otps_temp_user_data ON email_otps USING GIN (temp_user_data);
CREATE INDEX IF NOT EXISTS idx_mobile_otps_temp_user_data ON mobile_otps USING GIN (temp_user_data);

COMMENT ON COLUMN email_otps.temp_user_data IS 'Temporary storage for user registration data (firstName, lastName, email, phone) until OTP is verified';
COMMENT ON COLUMN mobile_otps.temp_user_data IS 'Temporary storage for user registration data (firstName, lastName, email, phone) until OTP is verified';
```

6. Click **Run** and verify success

---

## Step 2: Verify Migrations

Run this query in SQL Editor to verify:

```sql
-- Check users table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'status';

-- Check OTP tables
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('email_otps', 'mobile_otps')
AND column_name = 'temp_user_data';

-- Check all existing users are active
SELECT status, COUNT(*) as count
FROM users
GROUP BY status;
```

✅ **If all queries return expected results, migrations are successful!**

---

## Step 3: Test the New Flow

### Test New User Registration

1. Open your app in incognito mode
2. Go to registration page
3. Fill out the form and submit
4. **CHECK DATABASE**: User should NOT exist yet
5. Enter OTP code
6. **CHECK DATABASE**: User should now exist with status='active'

---

## Success Criteria

✅ Migrations run without errors
✅ All existing users have status='active'
✅ New registration creates user ONLY after OTP
✅ Existing users can still login

---

**See AUTHENTICATION_FIX_SUMMARY.md for complete details**
