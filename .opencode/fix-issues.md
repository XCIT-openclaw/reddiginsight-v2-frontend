# Fix Issues for ReddigInsight v2 MVP

## Issue 1: Chat JSON Output Format Unstable

**Problem**: AI outputs JSON with inconsistent formatting, causing the confirmation dialog not to trigger.

**Example problematic output**:
```json
AI{"subreddit": "programming",keywords": "ChatGPT, GitHub Cop, code completion", "timeRange": "month",limit }
```

**Issues**:
- Missing quotes around keys
- Truncated values
- Missing closing braces

**File to fix**: `src/app/chat/page.tsx` (SYSTEM_PROMPT)

**Required fix**:
1. Strengthen System Prompt JSON output rules
2. Add stricter validation before parsing
3. Handle malformed JSON gracefully

## Issue 2: Dashboard Input Fields Not Displaying URL Parameters

**Problem**: URL parameters are passed correctly (?subreddit=programming&keywords=...) but input fields don't show the values.

**File to fix**: `src/app/dashboard/page.tsx`

**Required fix**:
1. Read URL searchParams on component mount
2. Populate input fields with parameter values
3. Ensure the form displays "Parameters loaded from AI conversation" message with actual values

## Acceptance Criteria

1. Chat AI outputs valid JSON 100% of the time
2. Confirmation dialog appears when valid JSON is detected
3. Dashboard URL parameters correctly populate input fields
4. Both features work end-to-end
