# Deployment Checklist - Desktop Browser Fix

## Pre-Deployment

- [x] Cookie settings updated in all authentication routes
- [x] COOKIE_DOMAIN variable added to .env
- [x] Documentation created (DESKTOP_BROWSER_FIX.md)
- [ ] Code reviewed and tested locally

## Deployment Steps

### 1. Test Locally First
```bash
# Test that localhost still works
npm run dev
# Open http://localhost:3000
# Test login/register flow
# Test profile builder
```

### 2. Commit and Push Changes
```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "fix: update cookie SameSite policy for desktop browser compatibility

- Changed sameSite from 'lax' to 'none' in all auth routes
- Added COOKIE_DOMAIN environment variable support
- Fixed profile save and coupon auto-apply issues on desktop browsers
- Updated: verify-otp, auth/login, admin-login, verify-mobile-otp routes
- Maintains security with httpOnly and secure flags"

# Push to repository
git push origin main
```

### 3. Update Production Environment Variables

**On Vercel/Netlify/Your Hosting Platform:**

1. Go to your project settings
2. Navigate to Environment Variables
3. Add new variable:
   - **Name:** `COOKIE_DOMAIN`
   - **Value:** `.linkist.ai`
   - **Environment:** Production

4. Click "Save"
5. Redeploy if needed

**Important:** The leading dot (`.linkist.ai`) is required for subdomain support.

### 4. Deploy to Production

**Option A: Automatic deployment (if configured)**
- Push to main branch triggers auto-deploy
- Wait for deployment to complete

**Option B: Manual deployment**
```bash
# If using Vercel CLI
vercel --prod

# If using Netlify CLI
netlify deploy --prod
```

### 5. Verify Deployment

**A. Check Environment Variables:**
```bash
# Using Vercel CLI
vercel env ls

# Or check in dashboard
# Ensure COOKIE_DOMAIN=.linkist.ai is set for Production
```

**B. Test on Production Site:**

1. **Clear Browser Data**
   - Chrome: Settings → Privacy → Clear browsing data → Cookies
   - Safari: Preferences → Privacy → Manage Website Data → Remove All
   - Firefox: Settings → Privacy → Clear Data → Cookies

2. **Test Desktop Browser - Chrome**
   - [ ] Open https://linkist.ai in Chrome
   - [ ] Register/Login
   - [ ] Open DevTools → Application → Cookies
   - [ ] Verify `session` cookie exists with:
     - ✅ `SameSite=None`
     - ✅ `Secure` flag enabled
     - ✅ `HttpOnly` flag enabled
   - [ ] Test Profile Builder (save profile)
   - [ ] Test Coupon Auto-Apply (checkout page)

3. **Test Desktop Browser - Safari**
   - [ ] Open https://linkist.ai in Safari
   - [ ] Login/Register
   - [ ] Test Profile Builder
   - [ ] Test Coupon Auto-Apply

4. **Test Desktop Browser - Firefox**
   - [ ] Open https://linkist.ai in Firefox
   - [ ] Login/Register
   - [ ] Test Profile Builder
   - [ ] Test Coupon Auto-Apply

5. **Regression Test - Mobile Browsers**
   - [ ] Test on mobile Safari (iOS)
   - [ ] Test on mobile Chrome (Android)
   - [ ] Verify all features still work

6. **Regression Test - Localhost**
   - [ ] Run `npm run dev`
   - [ ] Test login/register
   - [ ] Test profile builder
   - [ ] Verify localhost still works correctly

## Post-Deployment Monitoring

### 1. Check Server Logs
```bash
# On Vercel
vercel logs

# Look for:
# - Authentication errors
# - Cookie-related warnings
# - Session creation/validation issues
```

### 2. Monitor User Reports
- [ ] Watch for user complaints about login issues
- [ ] Check support channels for cookie-related problems
- [ ] Monitor error tracking (Sentry, etc.)

### 3. Analytics Check
- [ ] Verify login success rate hasn't decreased
- [ ] Check profile save completion rate
- [ ] Monitor checkout conversion rate

## Rollback Plan (If Issues Occur)

### Quick Rollback:
```bash
# Revert the commit
git revert HEAD

# Push the revert
git push origin main

# Or rollback deployment in Vercel/Netlify dashboard
```

### Alternative - Temporary Fix:
Update environment variable on production:
```
COOKIE_DOMAIN=  (leave empty)
```
This reverts to old behavior while you investigate.

## Common Issues and Solutions

### Issue 1: "Session cookie not found"
**Solution:**
- Verify `COOKIE_DOMAIN=.linkist.ai` is set in production
- Check HTTPS is enabled
- Clear browser cookies and retry

### Issue 2: "Localhost stopped working"
**Solution:**
- Ensure local `.env` has `COOKIE_DOMAIN=` (empty)
- Restart development server
- Clear localhost cookies

### Issue 3: "Still not working on desktop"
**Solution:**
- Check browser is not in strict privacy mode
- Disable browser extensions temporarily
- Try incognito/private mode
- Verify SSL certificate is valid

## Success Criteria

✅ **Fix is successful when:**
- [ ] Profile Builder saves data on desktop Chrome
- [ ] Profile Builder saves data on desktop Safari
- [ ] Profile Builder saves data on desktop Firefox
- [ ] Coupon auto-applies on desktop checkout page
- [ ] Mobile browsers still work (no regression)
- [ ] Localhost development still works
- [ ] No authentication errors in server logs
- [ ] Session cookies visible in browser DevTools

## Timeline Estimate

- **Deployment:** 5-10 minutes
- **Testing:** 15-20 minutes
- **Monitoring:** 24-48 hours

## Contact for Issues

If critical issues arise:
1. Check DESKTOP_BROWSER_FIX.md for troubleshooting
2. Review server logs for errors
3. Test in incognito mode to isolate issue
4. Consider temporary rollback if needed

---

**Prepared:** November 18, 2025
**Critical Changes:** Cookie configuration in authentication
**Risk Level:** Low (backward compatible, improves functionality)
**Testing:** Required on desktop browsers before marking complete
