import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

interface SubredditInfo {
  name: string;
  description: string;
  subscribers: number;
}

export async function POST(request: NextRequest) {
  try {
    // Auth: exact same pattern as /api/profile (uses Supabase session cookie via @supabase/ssr)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('[admin-popular] Auth failed:', authError?.message || 'no user');
      return NextResponse.json({ error: 'Unauthorized - please log in' }, { status: 401 });
    }

    console.log('[admin-popular] User:', user.email);

    // Check admin status via profile read (same as profile route)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      console.log('[admin-popular] Not admin:', profileError?.message);
      return NextResponse.json({ error: 'Forbidden - admin access required' }, { status: 403 });
    }

    console.log('[admin-popular] Admin verified, reading body...');

    const body = await request.json();
    const subreddits: SubredditInfo[] = body.subreddits;

    if (!Array.isArray(subreddits) || subreddits.length === 0) {
      return NextResponse.json({ error: 'No valid subreddits provided' }, { status: 400 });
    }

    // Deduplicate
    const seen = new Set<string>();
    const unique = subreddits.filter(s => {
      if (seen.has(s.name)) return false;
      seen.add(s.name);
      return true;
    });

    console.log('[admin-popular] Writing', unique.length, 'subreddits with service role...');

    // Write with service role to bypass RLS
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
      .from('popular_subreddits_cache')
      .upsert({
        id: 1,
        data: unique,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[admin-popular] Write error:', error.message);
      return NextResponse.json({ error: 'Failed to save: ' + error.message }, { status: 500 });
    }

    console.log('[admin-popular] SUCCESS - saved', unique.length);
    // Notify backend to refresh its in-memory cache
    const backendUrl = process.env.BACKEND_URL || "http://106.15.90.140:3001";
    try {
      const token = request.headers.get("Authorization") || "";
      const refreshRes = await fetch(backendUrl + "/api/reddit/refresh-popular", {
        method: "POST",
        headers: { "Authorization": token },
      });
      const refreshData = await refreshRes.json().catch(() => ({}));
      console.log("[admin-popular] Backend cache refreshed:", refreshData);
    } catch (refreshErr: any) {
      console.warn("[admin-popular] Failed to notify backend (non-fatal):", refreshErr.message);
    }

    return NextResponse.json({ success: true, count: unique.length });
  } catch (error: any) {
    console.error('[admin-popular] Exception:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
