import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const backendUrl = process.env.BACKEND_URL || 'http://106.15.90.140:3001';
    const backendResponse = await fetch(backendUrl + '/api/reports/' + id, {
      headers: { 'Authorization': 'Bearer ' + token },
    });
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error:', backendResponse.status, errorText);
      return NextResponse.json(
        { error: 'Backend error: ' + backendResponse.status },
        { status: backendResponse.status }
      );
    }
    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Report detail API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}