# Task: Debug Chat Page 307 Redirect Issue

## Problem Description
After successful login, accessing /chat page returns 307 redirect to /login?redirect=/chat

## Current Flow
1. User logs in at /login with email/password
2. `signInWithPassword()` succeeds → tokens stored in localStorage
3. Client calls `/api/auth/set-session` to set cookies
4. Client does `window.location.href = '/chat'` (hard redirect)
5. Middleware intercepts /chat request
6. `supabase.auth.getUser()` returns NO USER
7. Middleware returns 307 redirect to /login

## Files Involved
- `src/middleware.ts` - Edge middleware that checks auth
- `src/lib/supabase/middleware.ts` - Session update logic
- `src/app/login/page.tsx` - Login page
- `src/contexts/AuthContext.tsx` - Auth context with signIn function
- `src/app/api/auth/set-session/route.ts` - API to set session cookies

## Key Observations
1. Login succeeds (tokens are valid)
2. `/api/auth/set-session` returns success
3. But middleware's `getUser()` fails on next request

## Possible Root Causes
1. Cookie not being saved by browser (SameSite/Secure attributes)
2. Cookie not being read by middleware (cookie name mismatch)
3. Cookie domain/path configuration issue
4. Timing issue (cookie not set before redirect)
5. Supabase cookie configuration mismatch

## Debug Steps
1. Check browser console for cookie-related warnings
2. Verify cookie is actually set after /api/auth/set-session
3. Check middleware logs for cookie reading
4. Verify Supabase cookie name and configuration
5. Test with simplified middleware (skip auth check for /chat)

## Expected Fix
- Ensure cookies are properly set and readable by middleware
- Or implement alternative auth flow that doesn't rely on cookies for middleware
