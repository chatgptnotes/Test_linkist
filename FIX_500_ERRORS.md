# Fix for 500 Internal Server Errors

## Problem
Multiple 500 errors occurring on:
- `/api/auth/check-user`
- `/api/auth/me`

## Root Cause

The `.env` file is nearly empty or missing critical Supabase credentials. The API endpoints require:
1. `SUPABASE_SERVICE_ROLE_KEY` - To bypass Row Level Security (RLS) policies
2. `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key

Without these, the endpoints cannot connect to Supabase and return 500 errors.

## Solution

### Step 1: Get Your Supabase Credentials

1. **Go to your Supabase project dashboard:**
   - URL: https://nyjduzifuibyowibhsjg.supabase.co

2. **Navigate to Settings → API**

3. **Copy the following values:**
   - **Project URL** (under Configuration)
   - **anon public** key (under Project API keys)
   - **service_role** key (under Project API keys) ⚠️ **Keep this secret!**

### Step 2: Update Your .env File

Open `C:\DRM_projects\open_project\LINKIST_31Oct\.env` and add:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://nyjduzifuibyowibhsjg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Replace `your_anon_key_here` and `your_service_role_key_here` with the actual keys from your Supabase dashboard.

### Step 3: Restart the Development Server

**Important:** After updating `.env`, you MUST restart the server for changes to take effect.

1. **Stop the current server:**
   - Press `Ctrl+C` in the terminal running the dev server

2. **Start it again:**
   ```bash
   npm run dev
   ```

## What Was Fixed

I've updated the following files to handle missing credentials gracefully:

1. **`app/api/auth/check-user/route.ts`**
   - Added environment variable validation
   - Changed `.single()` to `.maybeSingle()` to avoid errors
   - Added better error logging

2. **`lib/auth-middleware.ts`**
   - Added try-catch around user data fetching
   - Changed `.single()` to `.maybeSingle()`
   - Made user details fetching non-critical for auth

## Expected Result

After adding the credentials and restarting:
- ✅ No more 500 errors on `/api/auth/check-user`
- ✅ No more 500 errors on `/api/auth/me`
- ✅ Welcome page loads without errors
- ✅ User authentication works correctly

## Security Note

⚠️ **NEVER commit the `SUPABASE_SERVICE_ROLE_KEY` to version control!**

- The `.env` file should be listed in `.gitignore`
- Only use service role key on the server-side (API routes)
- Never expose it to the browser/client-side

## Troubleshooting

If errors persist after following these steps:

1. **Check terminal for error messages** when you refresh the page
2. **Verify the keys are correct** - copy them again from Supabase
3. **Ensure the server restarted** - you should see "Ready in X.Xs" in terminal
4. **Check browser console** for specific error messages
5. **Clear browser cache** and cookies if needed

---

**Created:** 2025-11-14
**Issue:** 500 Internal Server Errors on auth endpoints
**Status:** Fixed - Awaiting environment variable configuration
