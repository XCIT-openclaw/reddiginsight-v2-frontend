import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface SubredditInfo {
  name: string;
  description: string;
  subscribers: number;
}

// In-memory cache (2 hour TTL)
let memoryCache: { data: SubredditInfo[]; ts: number } | null = null;
const MEMORY_TTL = 2 * 60 * 60 * 1000;

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: row, error } = await supabase
      .from('popular_subreddits_cache')
      .select('data, updated_at')
      .eq('id', 1)
      .maybeSingle();

    if (!error && row?.data && Array.isArray(row.data) && row.data.length > 0) {
      // Normalize: support both old string[] and new SubredditInfo[]
      const normalized: SubredditInfo[] = row.data.map((item: any) => {
        if (typeof item === 'string') {
          return { name: item, description: '', subscribers: 0 };
        }
        return {
          name: item.name || '',
          description: item.description || '',
          subscribers: item.subscribers || 0,
        };
      }).filter((s: SubredditInfo) => s.name);

      memoryCache = { data: normalized, ts: Date.now() };
      console.log('[popular-subreddits] Serving from Supabase,', normalized.length, 'subreddits');
      return NextResponse.json({
        success: true,
        subreddits: normalized,
        source: 'supabase',
        updated_at: row.updated_at,
      });
    }

    if (memoryCache && (Date.now() - memoryCache.ts) < MEMORY_TTL) {
      console.log('[popular-subreddits] Serving from memory cache');
      return NextResponse.json({
        success: true,
        subreddits: memoryCache.data,
        source: 'memory',
      });
    }

    console.log('[popular-subreddits] No data available');
    return NextResponse.json({
      success: true,
      subreddits: [],
      source: 'empty',
    });
  } catch (error: any) {
    console.error('[popular-subreddits] Error:', error.message);
    if (memoryCache?.data?.length) {
      return NextResponse.json({ success: true, subreddits: memoryCache.data, source: 'memory-stale' });
    }
    return NextResponse.json({ success: true, subreddits: [] });
  }
}