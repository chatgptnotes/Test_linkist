# Mobile OTP Registration Fix - Summary

## Problem Identified

Users registering through the `/welcome-to-linkist` page were **not being created in the database** after OTP verification, even though they were successfully redirected.

### Root Cause

The codebase has **TWO separate OTP systems**:

1. **Unified OTP System** (✅ Already Fixed)
   - `/api/send-otp` and `/api/verify-otp`
   - Used by `/register` page
   - Already updated with `temp_user_data` logic

2. **Separate Mobile OTP System** (❌ Was Broken - NOW FIXED)
   - `/api/send-mobile-otp` and `/api/verify-mobile-otp`
   - Used by `/welcome-to-linkist` → `/verify-mobile` flow
   - **Was missing `temp_user_data` logic**

### Why Users Weren't Created

The separate mobile OTP endpoints:
- Only stored OTP with `user_id` (not registration data)
- Expected users to already exist in database
- Were designed for existing users to verify their mobile numbers
- Did NOT create new users during registration

---

## Solution Implemented

Updated the separate mobile OTP endpoints to match the unified OTP system's behavior.

### Changes Made

#### 1. Updated `/api/send-mobile-otp/route.ts`

**File**: `app/api/send-mobile-otp/route.ts`

**Changes**:
- Now accepts `firstName`, `lastName`, `email` in addition to `mobile`
- Stores registration data in `temp_user_data` JSONB field
- Added debug logging to track data flow

**Before** (Line 20):
```typescript
const { mobile } = await request.json();
```

**After** (Lines 20-22):
```typescript
const { mobile, firstName, lastName, email } = await request.json();

console.log('📱 [send-mobile-otp] Received request:', { mobile, firstName, lastName, email });
```

**OTP Storage Update** (Lines 105-132):
```typescript
// Store OTP with temp_user_data for new registrations
const tempUserData = (firstName && lastName) ? {
  firstName,
  lastName,
  email: email || null,
  phone: mobile
} : null;

console.log('💾 [send-mobile-otp] Storing OTP with temp_user_data:', tempUserData);

const stored = await SupabaseMobileOTPStore.set(mobile, {
  user_id: userId,
  mobile,
  otp,
  expires_at: expiresAt,
  verified: false,
  temp_user_data: tempUserData  // ← NEW FIELD
});

console.log(`✅ [send-mobile-otp] Mobile OTP stored: ${mobile}, user_id: ${userId || 'guest'}, has_temp_user_data: ${!!tempUserData}`);
```

---

#### 2. Updated `/api/verify-mobile-otp/route.ts`

**File**: `app/api/verify-mobile-otp/route.ts`

**Changes**:
- Checks for `temp_user_data` after OTP verification
- Creates new users from `temp_user_data` if user doesn't exist
- Activates user immediately after creation
- Creates session for new user
- Added comprehensive debug logging

**New User Creation Logic** (Lines 256-346):
```typescript
// New user - Check for registration data in temp_user_data
console.log('👤 [verify-mobile-otp] User not found, checking for registration data');

const mobileOTPRecord = await SupabaseMobileOTPStore.get(mobile);

console.log('📋 [verify-mobile-otp] OTP record:', {
  exists: !!mobileOTPRecord,
  has_temp_user_data: !!mobileOTPRecord?.temp_user_data,
  temp_user_data: mobileOTPRecord?.temp_user_data
});

if (mobileOTPRecord && mobileOTPRecord.temp_user_data) {
  console.log('🆕 [verify-mobile-otp] Creating new user account for mobile:', mobile);

  // Create the user account with pending status
  const newUser = await SupabaseUserStore.upsertByEmail({
    email: mobileOTPRecord.temp_user_data.email || `${Date.now()}@temp-mobile-user.com`,
    first_name: mobileOTPRecord.temp_user_data.firstName,
    last_name: mobileOTPRecord.temp_user_data.lastName,
    phone_number: mobile,
    role: 'user',
    status: 'pending',
    email_verified: false,
    mobile_verified: false,
  });

  console.log('✅ [verify-mobile-otp] New user created with pending status:', newUser.id);

  // Activate user now that OTP is verified
  const activatedUser = await SupabaseUserStore.activateUser(newUser.id, 'mobile');
  console.log('✅ [verify-mobile-otp] User activated successfully with mobile verification');

  // Create session
  const sessionId = await SessionStore.create(activatedUser.id, activatedUser.email, activatedUser.role);
  console.log('✅ [verify-mobile-otp] Session created for new user:', sessionId);

  // Return success with session cookie
}
```

**Same logic added for Twilio verification path** (Lines 113-179)

---

#### 3. Updated `/verify-mobile/page.tsx`

**File**: `app/verify-mobile/page.tsx`

**Changes**:
- Reads registration data from localStorage (stored by `/welcome-to-linkist`)
- Sends firstName, lastName, email along with mobile to `/api/send-mobile-otp`
- Added logging for debugging

**Updated OTP Request** (Lines 87-119):
```typescript
// Get user profile data from localStorage to send registration data
const userProfileStr = localStorage.getItem('userProfile');
let firstName = '';
let lastName = '';
let email = '';

if (userProfileStr) {
  try {
    const userProfile = JSON.parse(userProfileStr);
    firstName = userProfile.firstName || '';
    lastName = userProfile.lastName || '';
    email = userProfile.email || '';
    console.log('📋 [verify-mobile] Sending registration data:', { firstName, lastName, email, mobile: phoneNumber });
  } catch (parseError) {
    console.error('Failed to parse userProfile from localStorage:', parseError);
  }
} else {
  console.warn('⚠️ [verify-mobile] No userProfile found in localStorage - this may be a login attempt');
}

const response = await fetch('/api/send-mobile-otp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mobile: phoneNumber,
    firstName,      // ← NEW
    lastName,       // ← NEW
    email          // ← NEW
  }),
});
```

---

## Complete Registration Flow (Fixed)

### New User Registration Flow

1. **User fills registration form** on `/welcome-to-linkist`
   - Enters: firstName, lastName, email, mobile

2. **Frontend calls** `/api/auth/register`
   - Validates data (doesn't create user)
   - Returns success

3. **Frontend stores data** in localStorage
   ```javascript
   localStorage.setItem('userProfile', JSON.stringify({
     email, firstName, lastName, country, mobile
   }));
   ```

4. **Redirect to** `/verify-mobile?phone=...`

5. **verify-mobile page auto-sends OTP**
   - Reads registration data from localStorage
   - Calls `/api/send-mobile-otp` with: `{ mobile, firstName, lastName, email }`

6. **Backend stores OTP** with `temp_user_data`
   ```javascript
   {
     mobile: "+916666666600",
     otp: "123456",
     temp_user_data: {
       firstName: "John",
       lastName: "Doe",
       email: "john@example.com",
       phone: "+916666666600"
     }
   }
   ```

7. **User enters OTP** and submits

8. **Backend verifies OTP** (`/api/verify-mobile-otp`)
   - Checks if user exists
   - If NOT exists, reads `temp_user_data`
   - Creates user with status='pending'
   - Activates user (status='active', mobile_verified=true)
   - Creates session
   - Returns success

9. **User is redirected** to `/product-selection`
   - User now exists in database ✅
   - User is logged in ✅

---

## Testing Instructions

### Prerequisites
- Database migrations already run (status column and temp_user_data column exist)
- Development server running

### Test New User Registration

1. **Clear browser data**
   ```
   - Clear cookies
   - Clear localStorage
   - Use incognito/private mode
   ```

2. **Start registration**
   - Go to `/welcome-to-linkist`
   - Fill in all fields:
     - First Name: Test
     - Last Name: User
     - Email: test@example.com
     - Mobile: +916666666600 (or your test number)
   - Submit form

3. **Check console logs** (Browser)
   ```
   ✅ Registration validation passed
   📋 [verify-mobile] Sending registration data: {firstName: 'Test', lastName: 'User', email: 'test@example.com', mobile: '+916666666600'}
   ```

4. **Check server logs**
   ```
   📱 [send-mobile-otp] Received request: {mobile: '+916666666600', firstName: 'Test', lastName: 'User', email: 'test@example.com'}
   💾 [send-mobile-otp] Storing OTP with temp_user_data: {firstName: 'Test', lastName: 'User', ...}
   ✅ [send-mobile-otp] Mobile OTP stored: +916666666600, user_id: guest, has_temp_user_data: true
   ```

5. **Check database** (mobile_otps table)
   ```sql
   SELECT mobile, temp_user_data, created_at
   FROM mobile_otps
   WHERE mobile = '+916666666600'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

   **Expected**:
   ```json
   {
     "mobile": "+916666666600",
     "temp_user_data": {
       "firstName": "Test",
       "lastName": "User",
       "email": "test@example.com",
       "phone": "+916666666600"
     }
   }
   ```

6. **Enter OTP** (use devOtp from console or check server logs)

7. **Check server logs after OTP submission**
   ```
   👤 [verify-mobile-otp] User not found, checking for registration data
   📋 [verify-mobile-otp] OTP record: {exists: true, has_temp_user_data: true, temp_user_data: {...}}
   🆕 [verify-mobile-otp] Creating new user account for mobile: +916666666600
   ✅ [verify-mobile-otp] New user created with pending status: <uuid>
   ✅ [verify-mobile-otp] User activated successfully with mobile verification
   ✅ [verify-mobile-otp] Session created for new user: <session-id>
   ```

8. **Check database** (users table)
   ```sql
   SELECT id, first_name, last_name, email, phone_number, status, mobile_verified
   FROM users
   WHERE phone_number = '+916666666600'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

   **Expected**:
   ```
   id: <uuid>
   first_name: Test
   last_name: User
   email: test@example.com
   phone_number: +916666666600
   status: active
   mobile_verified: true
   ```

9. **Verify redirect**
   - Should redirect to `/product-selection`
   - User should be logged in
   - Session cookie should be set

---

## Success Criteria

✅ Registration form data is sent to `/api/send-mobile-otp`
✅ `temp_user_data` is stored in mobile_otps table
✅ User is created ONLY after OTP verification
✅ User status is 'active' and mobile_verified is true
✅ Session is created and user is logged in
✅ User is successfully redirected to product selection

---

## Debug Logs Reference

### Successful Registration Logs

**Browser Console:**
```
📋 [verify-mobile] Sending registration data: {firstName: 'Test', lastName: 'User', email: 'test@example.com', mobile: '+916666666600'}
🔑 Development OTP: 123456
```

**Server Console (send-otp):**
```
📱 [send-mobile-otp] Received request: {mobile: '+916666666600', firstName: 'Test', lastName: 'User', email: 'test@example.com'}
💾 [send-mobile-otp] Storing OTP with temp_user_data: {firstName: 'Test', lastName: 'User', email: 'test@example.com', phone: '+916666666600'}
✅ [send-mobile-otp] Mobile OTP stored: +916666666600, user_id: guest, has_temp_user_data: true
```

**Server Console (verify-otp):**
```
👤 [verify-mobile-otp] User not found, checking for registration data
📋 [verify-mobile-otp] OTP record: {exists: true, has_temp_user_data: true, temp_user_data: {firstName: 'Test', lastName: 'User', ...}}
🆕 [verify-mobile-otp] Creating new user account for mobile: +916666666600
✅ [verify-mobile-otp] New user created with pending status: a1b2c3d4-...
✅ [verify-mobile-otp] User activated successfully with mobile verification
✅ [verify-mobile-otp] Session created for new user: xyz789...
```

---

## Files Modified

1. `app/api/send-mobile-otp/route.ts` - Accept and store temp_user_data
2. `app/api/verify-mobile-otp/route.ts` - Create users from temp_user_data
3. `app/verify-mobile/page.tsx` - Send registration data from localStorage

---

## Related Documentation

- `DEBUG_REGISTRATION_FIX.md` - Original debug logging for unified OTP system
- `AUTHENTICATION_FIX_SUMMARY.md` - Complete authentication fix documentation
- `AUTH_FIX_QUICKSTART.md` - Quick deployment guide for database migrations

---

**Fix Completed**: 2025-11-15
**Status**: Ready for testing
