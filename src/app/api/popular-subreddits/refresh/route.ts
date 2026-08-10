import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * This endpoint is no longer used for automated Reddit fetching.
 * Popular subreddits are now manually populated via the Admin page:
 *   /admin/popular-subreddits
 *
 * The cron in vercel.json can be removed or kept — it will just
 * return this informational response.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Automated Reddit fetch is disabled due to Reddit anti-bot restrictions. Please use the Admin page at /admin/popular-subreddits to manually update the cache.',
  });
}
