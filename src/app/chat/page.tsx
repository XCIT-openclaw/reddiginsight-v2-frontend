'use client';

// Force dynamic rendering - auth-dependent pages cannot be statically pre-rendered
export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ChatMessage } from './components/ChatMessage';
import { AuthRequiredNotice } from '@/components/AuthRequiredNotice';
import { DashboardNav } from '@/components/DashboardNav';
import { ChatInput } from './components/ChatInput';
import { TypingIndicator } from './components/TypingIndicator';
import { SearchParamsCard } from './components/SearchParamsCard';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Sparkles, AlertCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Abort the request only if the stream stays idle for too long.
// This keeps long AI responses alive while still failing hung requests.
const STREAM_IDLE_TIMEOUT_MS = 90000;
// Key for storing conversation history in localStorage
const CONVERSATION_STORAGE_KEY = 'reddiginsight_chat_history';
// Maximum messages to persist
const MAX_PERSISTED_MESSAGES = 50;

// Use a static timestamp for SSR stability - prevents hydration mismatch
// The timestamp is set to a fixed date since this is the initial welcome message
const INITIAL_TIMESTAMP = new Date('2024-01-01T00:00:00Z');

const INITIAL_MESSAGE: Message = {
  id: '1',
  content: 'Hello! I\'m your Reddit Insight AI consultant. I can help you analyze discussions on Reddit about any product or idea.\nI will generate the search criteria for posts on Reddit in JSON format based on your ideas, You can review the JSON search criteria I generated on the right-hand side of the SEARCH PARAMETERS card, or you can navigate to the Dashboard page and enter the search information on the Direct Input card based on the data in the JSON.\n\nWhat would you like to analyze? It can be a product, an idea, or a topic you\'re interested in.',
  role: 'assistant',
  timestamp: INITIAL_TIMESTAMP,
};

function loadMessagesFromStorage(): Message[] {
  try {
    const stored = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((msg: Message) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }
    }
  } catch (e) {
    console.warn('Failed to load conversation history:', e);
  }
  return [INITIAL_MESSAGE];
}

function saveMessagesToStorage(messages: Message[]): void {
  try {
    const toSave = messages.slice(-MAX_PERSISTED_MESSAGES);
    localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('Failed to save conversation history:', e);
  }
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface QueryParams {
  subreddit: string;
  keywords: string;
  timeRange: string;
  limit?: number;
}

// Parse SSE data from OpenRouter stream
function parseSSEData(chunk: string): string {
  const lines = chunk.split('\n');
  let content = '';
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') continue;
      
      try {
        const parsed = JSON.parse(data);
        if (parsed.choices && parsed.choices[0]?.delta) {
          const delta = parsed.choices[0].delta;
          if (delta.content) {
            content += delta.content;
          }
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }
  
  return content;
}

// Extract JSON query parameters from AI response
function extractQueryParams(content: string): QueryParams | null {
  console.log('extractQueryParams called, content length:', content.length);
  
  // Guard: only extract if content contains JSON structure
  if (!/\{(?:[^{}]*("subreddit"|"keywords"|"timeRange"|"limit")){2,}[^{}]*\}/.test(content)) {
    console.log('No JSON structure detected, skipping extraction');
    return null;
  }
  
  // Remove markdown code block markers if present
  const cleanContent = content
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/`{1,2}([^`]+)`{1,2}/g, '$1');
  
  // Strategy 0: Pre-fix malformed JSON before regex matching
  let fixedContent = cleanContent;
  try {
    fixedContent = fixMalformedJson(cleanContent);
    if (fixedContent !== cleanContent) {
      console.log("Strategy 0: Pre-fixed malformed JSON");
    }
  } catch (e) {
    fixedContent = cleanContent;
  }

  // Strategy 1: Try to find and parse JSON objects
  const jsonPatterns = [
    /\{[\s\S]*?"(?:subreddit|subred|reddit)"[\s\S]*?"keywords"[\s\S]*?"timeRange"[\s\S]*?\}/g,
    /\{[\s\S]*?(?:subreddit|subred|reddit)[\s\S]*?keywords[\s\S]*?timeRange[\s\S]*?\}/gi,
    /\{[^{}]*\}/g,
  ];
  
  for (const pattern of jsonPatterns) {
    const matches = fixedContent.match(pattern);
    if (!matches) continue;
    
    for (const jsonStr of matches) {
      console.log('Attempting to parse JSON:', jsonStr);
      
      try {
        const parsed = JSON.parse(jsonStr);
        console.log('Direct parse successful:', parsed);
        if ((parsed.subreddit || parsed.subred || parsed.reddit) && parsed.keywords && (parsed.timeRange || parsed.time || parsed.timeRange === "")) {
          const normalized = normalizeQueryParams({ subreddit: parsed.subreddit || parsed.reddit, keywords: parsed.keywords, timeRange: parsed.timeRange || parsed.time || "month", limit: parsed.limit });
          if (normalized) {
            console.log('Successfully extracted params from direct parse:', normalized);
            return normalized;
          }
        }
      } catch {
        // JSON parsing failed, try to fix it
      }
      
      try {
        const fixedJson = fixMalformedJson(jsonStr);
        console.log('Fixed JSON:', fixedJson);
        const parsed = JSON.parse(fixedJson);
        console.log('Fixed parse successful:', parsed);
        if (parsed.subreddit || parsed.subred || parsed.reddit) {
          const normalized = normalizeQueryParams({
            subreddit: parsed.subreddit || parsed.reddit,
            keywords: parsed.keywords || parsed.keyword || '',
            timeRange: parsed.timeRange || parsed.time_range || parsed.time || 'month',
            limit: parsed.limit,
          });
          if (normalized) {
            console.log('Successfully extracted params from fixed JSON:', normalized);
            return normalized;
          }
        }
      } catch (e) {
        console.log('Failed to parse fixed JSON:', e);
        continue;
      }
    }
  }
  
  // Strategy 2: Extract fields individually if JSON extraction failed
  const fieldExtractors = {
    subreddit: /["'"]?(?:subreddit|subred|reddit)["'"]?[\s]*:[\s]*["'"]?([a-zA-Z0-9_\-\+]+)["'"]?/i,
    keywords: /["'"]?keywords["'"]?[\s]*:[\s]*["'"]?([a-zA-Z0-9_\-\+\s,]+)["'"]?/i,
    timeRange: /["'"]?(?:timeRange|Range|time|time_range)["'"]?[\s]*:[\s]*["'"]?([a-zA-Z]*)["'"]?/i,
    limit: /["\x27]?limit["\x27]?[\s]*:[\s]*(\d+)/i,
  };
  
  const extracted: Record<string, string | number | undefined> = {};
  
  for (const [field, regex] of Object.entries(fieldExtractors)) {
    const match = cleanContent.match(regex);  // use original content, fixMalformedJson may truncate values
    if (match) {
      extracted[field] = field === 'limit' ? parseInt(match[1]) : match[1];
      console.log(`Regex extracted ${field}:`, match[1]);
    }
  }
  
  if (extracted.subreddit) {
    const normalized = normalizeQueryParams({
      subreddit: extracted.subreddit as string,
      keywords: (extracted.keywords as string) || '',
      timeRange: (extracted.timeRange || extracted.time) as string || 'month',
      limit: extracted.limit as number | undefined,
    });
    if (normalized) {
      console.log('Successfully extracted params from regex:', normalized);
      return normalized;
    }
  }
  
  // Strategy 3: Use robust JSON extraction as final fallback
  console.log('Strategy 3: Trying robust JSON extraction');
  const robustExtract = robustExtractJson(cleanContent);
  if (robustExtract) {
    console.log('Robust extract found:', robustExtract);
    try {
      const parsed = JSON.parse(robustExtract);
      console.log('Robust parse successful:', parsed);
      if ((parsed.subreddit || parsed.subred || parsed.reddit) && parsed.keywords && (parsed.timeRange || parsed.time || parsed.timeRange === "")) {
        const normalized = normalizeQueryParams({ subreddit: parsed.subreddit || parsed.reddit, keywords: parsed.keywords, timeRange: parsed.timeRange || parsed.time || "month", limit: parsed.limit });
        if (normalized) {
          console.log('Successfully extracted params from robust extract:', normalized);
          return normalized;
        }
      }
    } catch (e) {
      console.log('Robust extract parsing failed:', e);
    }
  }
  
  console.log('Failed to extract valid params from content');
  return null;
}


// Robust JSON extraction - find JSON-like patterns and fix them
function robustExtractJson(text: string): string | null {
  const jsonStart = text.indexOf('{');
  if (jsonStart === -1) return null;
  
  let braceCount = 0;
  let jsonEnd = -1;
  
  for (let i = jsonStart; i < text.length; i++) {
    if (text[i] === '{') braceCount++;
    if (text[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        jsonEnd = i + 1;
        break;
      }
    }
  }
  
  if (jsonEnd === -1) return null;
  
  return text.slice(jsonStart, jsonEnd);
}


// Fix empty keys by position: map to missing required fields (subreddit->keywords->timeRange->limit)
function fixEmptyKeys(jsonStr: string): string {
  const required = ['subreddit', 'keywords', 'timeRange', 'limit'];
  const existing = new Set();
  for (let r = 0; r < required.length; r++) {
    if (jsonStr.indexOf('"' + required[r] + '"') !== -1) existing.add(required[r]);
  }
  const missing = required.filter(function(k) { return !existing.has(k); });
  let idx = 0;
  const result = jsonStr.replace(/"":\s*(?:\"([^\"]*)\"|(\d+))/g, function(match, strVal, numVal) {
    if (idx >= missing.length) return match;
    const key = missing[idx];
    idx++;
    if (strVal !== undefined) return '\"' + key + '\": \"' + strVal + '\"';
    return '\"' + key + '\": ' + numVal;
  });
  return result;
}
// Fix common JSON malformation issues
function fixMalformedJson(jsonStr: string): string {
  let fixed = jsonStr;
  
  // 0a. Fix Unicode smart/curly quotes (e.g. McDonald\u201Ds \u2192 McDonald's)
  fixed = fixed.replace(/[\u201C\u201D\u2018\u2019]/g, '"');
  
  // 0. Fix empty keys by position
  fixed = fixEmptyKeys(fixed);
  
  // 0a. Fix missing colon between quoted field and value: "timeRange" "year" -> "timeRange": "year"
  fixed = fixed.replace(/"(\w+)"\s+"([^"]*)"/g, '"$1": "$2"');

  // 0b. Fix empty field name "" to "limit": "": 100 -> "limit": 100
  // Empty-key mapping now handled by fixEmptyKeys (position-based)
  fixed = fixed.replace(/"":\s*(\d+)/g, '"limit": $1');

  // 1. Fix missing opening quote on field names: ,keywords" 闂備焦鍓氶崑鎾诲箯?,"keywords"
  fixed = fixed.replace(/([{,]\s*)(\w+)\"\s*:/g, '$1\"$2\":');
  
  // 2a. Fix "subred" field name -> "subreddit"
  fixed = fixed.replace(/(\b|\{|,)\"subred\":\s*\"([^\"]+)\"/gi, '$1"subreddit": "$2"');
  
  // 2. Fix "reddit" field name 闂備焦鍓氶崑鎾诲箯?"subreddit" (but NOT within "subreddit")
  fixed = fixed.replace(/(?<!sub)([\"']?)reddit\1\s*:\s*"([^"]+)"/gi, '"subreddit": "$2"');
  
  // 2b. Fix "time" field name -> "timeRange"
  fixed = fixed.replace(/(\b|\{|,)\"time\":\s*\"([^\"]+)\"/g, '$1"timeRange": "$2"');

  // 2c. Fix "Range" field name -> "timeRange"
  fixed = fixed.replace(/(\b|\{|,)\"Range\":\s*\"([^\"]+)\"/gi, '$1"timeRange": "$2"');

  // 3. Fix unquoted values after colon: :year" 闂備焦鍓氶崑鎾诲箯?:"year"
  fixed = fixed.replace(/:\s*(\w+)"([,\s}])/g, ':"$1"$2');
  fixed = fixed.replace(/:\s*(\w+)([",\s}])/g, ':"$1"$2');
  
  // 4. Fix merged field+value without colon: "subredditdogfood" 闂備焦鍓氶崑鎾诲箯?"subreddit": "dogfood"
  fixed = fixed.replace(/"(subred)(?!dit)([a-zA-Z_]\w+)"/gi, '"$1": "$2"');
  fixed = fixed.replace(/"(subreddit)([a-zA-Z_]\w+)"/gi, '"$1": "$2"');
  fixed = fixed.replace(/"(timeRange)([a-zA-Z_]\w+)"/gi, '"$1": "$2"');
  
  // 5. Fix missing comma between adjacent quoted strings
  fixed = fixed.replace(/"\s+"/g, '", "');
  
  // 6. Fix single quotes 闂備焦鍓氶崑鎾诲箯?double quotes
    // 6. Fix structural single quotes (keys and values only, not content inside strings)
  fixed = fixed.replace(/([{,]\s*)'(\w+)'(\s*:)/g, '$1"$2"$3');
  fixed = fixed.replace(/(:\s*)'([^']*)'(\s*[,}])/g, '$1"$2"$3');
  
  // 7. Remove trailing commas
  fixed = fixed.replace(/,\s*([}\]])/g, '$1');
  
  // 8. Remove double-double quotes
  fixed = fixed.replace(/""+/g, '"');
  
  // 9. Ensure braces
  if (!fixed.startsWith('{')) fixed = '{' + fixed;
  if (!fixed.endsWith('}')) fixed = fixed + '}';
  
  return fixed;
}
function isValidValue(value: string): boolean {
  if (!value || value.trim() === '') return false;
  if (value.length < 2 && /^[\.\/\-\_\:\;\,\s]+$/.test(value)) return false;
  if (/^[\.\/\-\_\:\;\,\s\*\#\@\!\?\&\%\^\~]+$/.test(value)) return false;
  if (!/[a-zA-Z0-9]/.test(value)) return false;
  return true;
}

// Normalize and clean extracted params
function normalizeQueryParams(params: Record<string, unknown>): QueryParams | null {
  let subreddit = String(params.subreddit || params.subred || params.reddit || params.subdit || '');
  
  subreddit = subreddit.replace(/^r\//i, '');
  subreddit = subreddit.trim().replace(/["']/g, '');
  
  const keywords = String(params.keywords || params.keyword || '').trim();
  // Limit to max 5 keywords (comma-separated)
  const keywordsParts = keywords ? keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0).slice(0, 5) : [];
  const truncatedKeywords = keywordsParts.join(", ");
  const timeRange = String(params.timeRange || params.time_range || 'month').trim();
  
  if (!isValidValue(subreddit)) {
    return null;
  }
  
  if (!isValidValue(truncatedKeywords)) {
    return null;
  }
  
  const validTimeRanges = ['day', 'week', 'month', 'year', 'all'];
  if (!validTimeRanges.includes(timeRange)) {
    console.warn('Invalid timeRange extracted:', timeRange, 'Defaulting to month');
  }
  
  return {
    subreddit,
    keywords: truncatedKeywords,
    timeRange: validTimeRanges.includes(timeRange) ? timeRange : 'month',
    limit: params.limit ? Number(params.limit) : undefined,
  };
}

export default function ChatPage() {
  const router = useRouter();
  const { user, loading: authLoading, session, profile } = useAuth();
  // Initialize with INITIAL_MESSAGE for proper SSR rendering
  // localStorage loading happens client-side in useEffect
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const hasNoCredits = Boolean(profile && (profile.credits ?? 0) <= 0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearHistory = () => {
    localStorage.removeItem(CONVERSATION_STORAGE_KEY);
    setMessages([INITIAL_MESSAGE]);
    setShowClearConfirm(false);
  };
  const [hydrated, setHydrated] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const abortReasonRef = useRef<'timeout' | 'unmount' | null>(null);
  
  // Query confirm dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [queryParams, setQueryParams] = useState<QueryParams | null>(null);

  // Load messages from localStorage on mount (client-side only)
  // Only update if there's actual stored history (not just empty/initial)
  useEffect(() => {
    const storedMessages = loadMessagesFromStorage();
    // Only update if we have real stored messages (length > 1 means user has history)
    if (storedMessages.length > 1) {
      setMessages(storedMessages);
    }
    setHydrated(true);
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (hydrated && messages.length > 0) {
      saveMessagesToStorage(messages);
    }
  }, [messages, hydrated]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortReasonRef.current = 'unmount';
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleConfirmQuery = () => {
    if (queryParams) {
      // Final validation before navigation
      if (!queryParams.subreddit || queryParams.subreddit.trim() === '' ||
          !queryParams.keywords || queryParams.keywords.trim() === '') {
        console.error('Invalid queryParams for navigation:', queryParams);
        setShowConfirmDialog(false);
        setQueryParams(null);
        return;
      }
      
      const params = new URLSearchParams();
      params.set('subreddit', queryParams.subreddit.trim());
      params.set('keywords', queryParams.keywords.trim());
      params.set('timeRange', queryParams.timeRange.trim());
      if (queryParams.limit) {
        params.set('limit', queryParams.limit.toString());
      }
      
      const url = `/dashboard?${params.toString()}`;
      console.log('Navigating to:', url);
      router.push(url);
    }
    setShowConfirmDialog(false);
    setQueryParams(null);
  };

  const handleCancelQuery = () => {
    setShowConfirmDialog(false);
    setQueryParams(null);
  };

  const handleSubmit = async (content: string) => {
    if (hasNoCredits) {
      setStreamError('You have no credits available. Please purchase credits to continue chatting.');
      return;
    }
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setStreamError(null);
    abortReasonRef.current = null;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const clearStreamTimeout = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
    const resetStreamTimeout = () => {
      clearStreamTimeout();
      timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortReasonRef.current = 'timeout';
          abortControllerRef.current.abort();
        }
      }, STREAM_IDLE_TIMEOUT_MS);
    };
    resetStreamTimeout();

    try {
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Session error or missing session:', sessionError);
        router.push('/login');
        return;
      }
      
      const token = session.access_token;

      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      console.log('Chat request starting, token length:', token.length);

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [
                        ...messages,
            userMessage
          ].map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let aiMessageContent = '';
      let done = false;

      const temporaryAiMessageId = `temp-${Date.now()}`;
      setMessages(prev => [
        ...prev,
        {
          id: temporaryAiMessageId,
          content: '',
          role: 'assistant',
          timestamp: new Date(),
        }
      ]);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunkValue = decoder.decode(value, { stream: true });
          console.log('Received chunk:', chunkValue.substring(0, 100));
          const parsedContent = parseSSEData(chunkValue);
          if (parsedContent) {
            resetStreamTimeout();
            aiMessageContent += parsedContent;
            
            setMessages(prev => 
              prev.map(msg => 
                msg.id === temporaryAiMessageId 
                  ? { ...msg, content: aiMessageContent } 
                  : msg
              )
            );
          }
        }
      }

      clearStreamTimeout();

      if (aiMessageContent.trim()) {
        const finalMessageId = Date.now().toString();
        setMessages(prev => 
          prev.map(msg => 
            msg.id === temporaryAiMessageId 
              ? { ...msg, id: finalMessageId, content: aiMessageContent } 
              : msg
          )
        );
        
        let extractedParams = extractQueryParams(aiMessageContent);
        
        if (!extractedParams) {
          const hasSubredditHint = /\{[^}]*"(?:subreddit|subred|reddit)"\s*:\s*"[^"]+"/i.test(aiMessageContent);
          if (!hasSubredditHint) {
            console.log('[Chat] No subreddit hint in response, skipping fallback');
          } else {
            console.log('[Chat] extractQueryParams failed, trying JSON mode fallback...');
          try {
            const supabase2 = createClient();
            const { data: { session: sess2 } } = await supabase2.auth.getSession();
            if (sess2) {
              const fbRes = await fetch('/api/chat/extract-params', { signal: AbortSignal.timeout(30000),
                method: 'POST',
                headers: {
                  'Authorization': 'Bearer ' + sess2.access_token,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messages: [...messages, { role: 'assistant', content: aiMessageContent }].map(m => ({ role: m.role, content: m.content })),
                }),
              });
              if (fbRes.ok) {
                const fbData = await fbRes.json();
                if (fbData.success && fbData.params) {
                  extractedParams = {
                    subreddit: fbData.params.subreddit,
                    keywords: fbData.params.keywords,
                    timeRange: fbData.params.timeRange,
                    limit: fbData.params.limit,
                  };
                  console.log('[Chat] JSON mode fallback succeeded:', extractedParams);
                }
              } else {
                console.warn('[Chat] JSON mode fallback failed:', fbRes.status);
              }
            }
          } catch (fbErr) {
            console.warn('[Chat] JSON mode fallback error:', fbErr);
          }
          }
        }
        
        if (extractedParams) {
          console.log('Extracted query params:', extractedParams);
          setQueryParams(extractedParams);
        }
      } else {
        setMessages(prev => prev.filter(msg => msg.id !== temporaryAiMessageId));
        throw new Error('No response received from AI. The stream may have ended unexpectedly.');
      }

    } catch (error) {
      clearStreamTimeout();
      console.error('Error sending message:', error);
      
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
      
      if (error instanceof Error && error.name === 'AbortError') {
        if (abortReasonRef.current === 'timeout') {
          setStreamError('The AI response took too long to continue. Please try again.');
        } else if (abortReasonRef.current !== 'unmount') {
          setStreamError('Request was cancelled.');
        }
      } else {
        setStreamError(error instanceof Error ? error.message : 'An unexpected error occurred.');
        
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: `Sorry, an error occurred: ${error instanceof Error ? error.message : 'Please try again.'}`,
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      clearStreamTimeout();
      setIsLoading(false);
      abortControllerRef.current = null;
      abortReasonRef.current = null;
    }
  };

  // Render a public, informative sign-in prompt instead of a blank page.
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20">
        <DashboardNav />
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <AuthRequiredNotice
            title="Sign in to use the AI research assistant"
            description="Describe your product idea or research question in chat. The assistant can suggest a subreddit, keywords, time range, and post limit for your analysis."
            bullets={[
              'Discuss a market, product idea, or research topic',
              'Get AI-suggested subreddits and keywords',
              'Choose a time range and post limit',
              'Continue to Dashboard with confirmed inputs',
            ]}
            returnTo="/chat"
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20">
      {/* Header with back navigation */}
      <header className="border-b border-border/30 py-4 px-6 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          {/* Back button */}
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-indigo-50">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          
          {/* Title */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              AI Assistant
            </h1>
          {/* Clear History Button */}
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Clear conversation history"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </div>
          </div>
        </div>
      </header>

      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowClearConfirm(false)} />
          <div className="relative z-10 bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Clear Confirm</h3>
            <p className="text-sm text-gray-600 mb-6">This will clear all conversation history.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowClearConfirm(false)}>
                CANCEL
              </Button>
              <Button size="sm" onClick={handleClearHistory} className="bg-red-600 hover:bg-red-700 text-white">
                OK
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main content: chat + sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full bg-gradient-to-b from-transparent to-indigo-50/30 dark:to-indigo-900/10">
            <div className="space-y-6">
              {authLoading ? (
                <div className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                  </div>
                </div>
              ) : (
                messages.filter(m => !(m.content === '' && m.role === 'assistant')).map((message) => (
                  <ChatMessage
                    key={message.id}
                    content={message.content}
                    role={message.role}
                    timestamp={message.timestamp}
                  />
                ))
              )}
              
              {isLoading && <TypingIndicator timestamp={messages.find(m => m.content === '' && m.role === 'assistant')?.timestamp} />}
              
              {streamError && (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span>{streamError}</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-border/30 py-4 px-6 max-w-4xl mx-auto w-full bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
            {hasNoCredits && (
              <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
                <span>You have no credits available. Purchase credits to continue chatting.</span>
                <Link href="/pricing" className="font-semibold underline">Purchase Credits</Link>
              </div>
            )}
            <ChatInput onSubmit={handleSubmit} disabled={authLoading || isLoading || hasNoCredits} />
          </div>
        </div>
        
        {/* Search Parameters Sidebar 闂?always visible */}
        <SearchParamsCard
          params={queryParams}
          isLoading={isLoading}
          onConfirm={handleConfirmQuery}
          onCancel={handleCancelQuery}
        />
      </div>
    </div>
  )
}


