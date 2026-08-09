import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const body = await request.json();
    const { subreddit, keywords, timeframe } = body;
    if (!subreddit || !keywords) {
      return NextResponse.json({ error: 'Subreddit and keywords are required' }, { status: 400 });
    }
    const keywordsArray = Array.isArray(keywords) ? keywords : String(keywords).split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
    const title = 'Reddit analysis of r/' + String(subreddit) + ' - ' + keywordsArray.slice(0, 2).join(', ');
    const backendUrl = process.env.BACKEND_URL || 'http://106.15.90.140:3001';
    const backendController = new AbortController();
    const backendTimeout = setTimeout(() => backendController.abort(), 25000);
    const backendResponse = await fetch(backendUrl + '/api/reports', {
      signal: backendController.signal, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ title, subreddit, keywords: keywordsArray, timeframe: timeframe || 'month', maxResults: 100 }),
    });
    clearTimeout(backendTimeout);
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error:', backendResponse.status, errorText);
      return NextResponse.json({ error: 'Backend error: ' + backendResponse.status }, { status: backendResponse.status });
    }
    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const backendUrl = process.env.BACKEND_URL || 'http://106.15.90.140:3001';
    const backendController = new AbortController();
    const backendTimeout = setTimeout(() => backendController.abort(), 15000);
    const backendResponse = await fetch(backendUrl + '/api/reports', {
      signal: backendController.signal, method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token },
    });
    clearTimeout(backendTimeout);
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error:', backendResponse.status, errorText);
      return NextResponse.json({ error: 'Backend error: ' + backendResponse.status }, { status: backendResponse.status });
    }
    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Reports List API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}