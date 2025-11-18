# Quick Fix Summary - Desktop Browser Cookie Issue

## What Was Fixed

✅ Profile Builder not saving on desktop browsers
✅ Coupon auto-apply not working on desktop browsers

## Root Cause

Session cookies with `sameSite: 'lax'` were blocked by desktop browsers' stricter security policies.

## Solution

Changed cookie settings from:
```typescript
sameSite: 'lax' → sameSite: 'none'
```

## Files Changed

1. `app/api/verify-otp/route.ts`
2. `app/api/auth/login/route.ts`
3. `app/api/admin-login/route.ts`
4. `app/api/verify-mobile-otp/route.ts`
5. `.env` (added COOKIE_DOMAIN)

## Deployment - 3 Steps

### Step 1: Push Code
```bash
git add .
git commit -m "fix: desktop browser cookie compatibility"
git push origin main
```

### Step 2: Add Environment Variable (Production Only)
**On Vercel/Netlify Dashboard:**
- Variable: `COOKIE_DOMAIN`
- Value: `.linkist.ai`
- Environment: Production

### Step 3: Test
1. Clear browser cookies
2. Login on desktop browser
3. Test profile save
4. Test coupon auto-apply

## That's It!

Your site will now work on desktop browsers.

---

**Need more details?** See `DESKTOP_BROWSER_FIX.md`
**Deployment steps?** See `DEPLOYMENT_CHECKLIST.md`
