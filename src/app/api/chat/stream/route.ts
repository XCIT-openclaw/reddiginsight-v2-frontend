import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Upstream timeout: abort the backend fetch if it stalls for this long.
// Prevents a hung backend stream (e.g. LLM provider outage) from pinning
// a Next.js worker indefinitely.
const UPSTREAM_TIMEOUT_MS = 120000;

// Note: System prompt with popular subreddits is now injected
// by the Aliyun backend (loaded once into memory on startup).
// This route is a pure pass-through proxy.

export async function POST(request: NextRequest) {
  console.log('[chat-stream] Pass-through proxy');

  const controller = new AbortController();
  const upstreamTimeout = setTimeout(() => {
    console.error('[chat-stream] Upstream timeout, aborting backend fetch');
    controller.abort();
  }, UPSTREAM_TIMEOUT_MS);
  const clearUpstreamTimeout = () => clearTimeout(upstreamTimeout);

  // If the client disconnects, stop reading from the upstream too.
  request.signal.addEventListener('abort', () => controller.abort());

  try {
    const body = await request.json();
    const { messages } = body;
    
    if (!messages || !Array.isArray(messages)) {
      clearUpstreamTimeout();
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      clearUpstreamTimeout();
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.slice(7);
    const backendUrl = process.env.BACKEND_URL || 'http://106.15.90.140:3001';
    
    console.log('[chat-stream] Forwarding', messages.length, 'messages to backend');
    
    const backendResponse = await fetch(backendUrl + '/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify({ messages }),  // messages passed as-is, backend injects system prompt
      signal: controller.signal,
    });
    
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('[chat-stream] Backend error:', backendResponse.status, errorText);
      clearUpstreamTimeout();
      return NextResponse.json(
        { error: 'Backend error: ' + backendResponse.status },
        { status: backendResponse.status }
      );
    }
    
    const reader = backendResponse.body?.getReader();
    if (!reader) {
      clearUpstreamTimeout();
      return NextResponse.json(
        { error: 'No response body from backend' },
        { status: 500 }
      );
    }
    
    const stream = new ReadableStream({
      async start(streamController) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) { streamController.close(); break; }
            streamController.enqueue(value);
          }
          clearUpstreamTimeout();
        } catch (error) {
          console.error('[chat-stream] Stream error:', error);
          clearUpstreamTimeout();
          streamController.error(error);
        }
      },
      cancel() {
        // Client aborted the stream - stop reading from the upstream.
        clearUpstreamTimeout();
        controller.abort();
      },
    });
    
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
    
  } catch (error) {
    clearUpstreamTimeout();
    console.error('[chat-stream] Error:', error);
    const isAbort = error instanceof Error && error.name === 'AbortError';
    return NextResponse.json(
      { error: isAbort ? 'Upstream timeout' : 'Internal server error' },
      { status: isAbort ? 504 : 500 }
    );
  }
}
