import { fetchWithProxy } from '@/lib/fetch-proxy';
import { callScraplingService, isServiceConfigured } from '@/lib/scrapling-service';
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const name = (url.searchParams.get('name') || '').trim();
    if (!name) {
      return NextResponse.json({ valid: false, reason: "Subreddit name is required" }, { status: 400 });
    }

    // Strategy 1: Try Scrapling Python service (Singapore server, bypasses GFW + Cloudflare)
    if (isServiceConfigured()) {
      const scraplingRes = await callScraplingService(
        '/validate?name=' + encodeURIComponent(name),
        { timeoutMs: 20000 }
      );
      if (scraplingRes && scraplingRes.ok) {
        const data = await scraplingRes.json();
        console.log('[validate] Scrapling service result for r/' + name + ':', data);
        return NextResponse.json(data);
      }
      console.warn('[validate] Scrapling service failed, falling back to direct Reddit');
    }

    // Strategy 2: Direct Reddit fetch (fallback)
    const redditUrl = 'https://www.reddit.com/r/' + encodeURIComponent(name) + '/';
    const redditRes = await fetchWithProxy(redditUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ReddigInsight/2.0)' },
      timeoutMs: 8000,
    });

    if (redditRes.status === 200) {
      const text = await redditRes.text();
      const notFound = text.includes("Sorry, there aren") || text.includes("community not found") || text.includes("doesn't exist");
      if (notFound) {
        return NextResponse.json({ valid: false, reason: "Subreddit not found" });
      }
      if (text.includes("This community has been banned") || text.includes("This is a private community")) {
        return NextResponse.json({ valid: false, reason: "Subreddit is banned or private" });
      }
      return NextResponse.json({ valid: true, displayName: 'r/' + name });
    }

    if (redditRes.status === 404) {
      return NextResponse.json({ valid: false, reason: "Subreddit not found" });
    }
    return NextResponse.json({ valid: false, reason: "Reddit returned " + redditRes.status });
  } catch (error: any) {
    console.error("[validate] Reddit fetch error:", error.message);
    return NextResponse.json({ valid: false, reason: error.message || "Unknown error" });
  }
}
