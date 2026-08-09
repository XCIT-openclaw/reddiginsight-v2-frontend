# Fix AuthContext Timeout & Dashboard Params Persistence

## Problem 1: AuthContext Timeout Clears User State

**Current Behavior**:
```typescript
// AuthContext.tsx
const AUTH_LOADING_TIMEOUT = 30000

setTimeout(() => {
  setUser(null)        // ← Problem: clears user after 30s
  setSession(null)
  setProfile(null)
  setLoading(false)
}, AUTH_LOADING_TIMEOUT)
```

**Issue**: After 30s timeout, `setUser(null)` causes Chat page to return `null` (input box disappears)

**Fix Required**:
1. Increase timeout to 60 seconds
2. On timeout, do NOT clear user state - keep last known state
3. Only clear on explicit sign out or definitive auth error
4. Add retry logic for getUser() on network errors

**File**: `src/contexts/AuthContext.tsx`

## Problem 2: Dashboard URL Parameters Not Persisting

**Current Behavior**:
```typescript
// dashboard/page.tsx
function SearchParamsHandler({ ... }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    setSubreddits(searchParams?.get('subreddit') || '')
    setKeywords(searchParams?.get('keywords') || '')
    // ← Problem: params lost on auth re-render
  }, [searchParams, ...])
}
```

**Issue**: When auth state changes (timeout/reload), SearchParamsHandler may not re-execute, causing params to be lost

**Fix Required**:
1. Save params to localStorage when loaded
2. On component mount, restore params from localStorage
3. Add fallback to parse URL manually if searchParams is null
4. Add debug logging

**File**: `src/app/dashboard/page.tsx`

## Acceptance Criteria

- [ ] Chat page input box stays visible even after 30s+ of inactivity
- [ ] AuthContext preserves user state on timeout (doesn't clear)
- [ ] Dashboard inputs retain values after auth state changes
- [ ] Dashboard params persist across page navigation
- [ ] No console errors related to auth timeout
- [ ] Build succeeds

## Files to Modify

1. `src/contexts/AuthContext.tsx` - Auth timeout & state preservation
2. `src/app/dashboard/page.tsx` - Params persistence with localStorage

## Environment

- Next.js: 16.2.1
- Supabase: @supabase/ssr + @supabase/supabase-js
- Deploy: Vercel (reddiginsight-v2.vercel.app)
