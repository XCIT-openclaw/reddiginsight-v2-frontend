# Fix MVP Issues - Round 2

## Issue 1: Chat Confirmation Dialog Not Triggering

**Problem**: AI JSON output format is unstable, causing extractQueryParams() to fail

**Symptoms from testing**:
- AI output: `{"subreddit": "programming",keywords": "ChatGPT, GitHub Cop, code completion", "timeRange": "month",limit }`
- Missing quotes around keys, truncated values, missing closing braces

**Files to check/fix**:
- `src/app/chat/page.tsx` - SYSTEM_PROMPT and extractQueryParams() function

**Required fixes**:
1. Review SYSTEM_PROMPT - ensure rules are clear enough
2. Strengthen extractQueryParams() with more robust JSON fixing
3. Add fallback regex extraction for malformed JSON
4. Test with various AI output formats

## Issue 2: Dashboard Input Fields Not Showing URL Parameters

**Problem**: URL parameters passed but input fields remain empty

**Current state**:
- SearchParamsHandler component exists
- Uses useSearchParams() hook
- Sets state via callbacks

**Files to check/fix**:
- `src/app/dashboard/page.tsx` - SearchParamsHandler component

**Debug steps**:
1. Check if useSearchParams() is working in production
2. Verify state updates are triggering re-renders
3. Check if Input components are controlled properly
4. Add console.log debugging

**Acceptance Criteria**:
1. Chat: AI outputs valid JSON 100% of the time
2. Chat: Confirmation dialog appears when JSON detected
3. Dashboard: URL params populate input fields on page load
4. Both: Work end-to-end in production
