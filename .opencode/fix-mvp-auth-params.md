# Fix MVP Auth & Params Issues

## Problem Summary

After the last MVP test session (2026-04-28), the following issues were identified:

### Issue 1: Chat Page Input Box Not Showing
**Symptom**: Chat page loads but input box is missing
**Root Cause**: AuthContext timeout (30s) clears user state, causing `!user` check to return null
**File**: `src/contexts/AuthContext.tsx`, `src/app/chat/page.tsx`

### Issue 2: Dashboard URL Parameters Not Filling
**Symptom**: URL has `?subreddit=X&keywords=Y&timeRange=Z` but inputs are empty
**Root Cause**: SearchParamsHandler may not be executing properly or params are lost during redirect
**File**: `src/app/dashboard/page.tsx`

### Issue 3: Middleware Redirect Loses URL Parameters
**Symptom**: When redirecting from Chat to Dashboard, URL parameters are lost
**Root Cause**: Middleware redirect doesn't preserve search params
**File**: `src/lib/supabase/middleware.ts` (already partially fixed)

## Fix Requirements

### 1. AuthContext Optimization
- Increase timeout from 30s to 60s for slow networks
- Add retry logic for getUser() on network errors
- Don't clear user state on timeout - keep last known state
- Add better error handling for Supabase network issues

### 2. Dashboard SearchParams Fix
- Ensure SearchParamsHandler executes after auth is loaded
- Add debug logging to track param flow
- Verify useSearchParams() works correctly with Next.js 16.2.1
- Add fallback to parse URL manually if searchParams is null

### 3. Middleware Param Preservation
- Verify middleware preserves URL params in redirect
- Test: `/dashboard?subreddit=X&keywords=Y` → login → redirect back with params

## Testing Steps

1. Login with test account
2. Navigate to Chat page - verify input box shows
3. Navigate to Dashboard with URL params - verify inputs are filled
4. Test Chat → Dashboard flow with params preservation
5. Test all redirects preserve URL parameters

## Acceptance Criteria

- [ ] Chat page shows input box within 5 seconds of loading
- [ ] Dashboard inputs are filled when URL has params
- [ ] Chat → Dashboard redirect preserves params
- [ ] No auth timeout errors in console
- [ ] All redirects preserve URL parameters

## Files to Modify

- `src/contexts/AuthContext.tsx` - Auth timeout & error handling
- `src/app/dashboard/page.tsx` - SearchParams handling
- `src/lib/supabase/middleware.ts` - Redirect param preservation (verify)

## Environment

- Next.js: 16.2.1
- Supabase: @supabase/ssr + @supabase/supabase-js
- Deploy: Vercel (reddiginsight-v2.vercel.app)
- Backend: http://106.15.90.140:3001
