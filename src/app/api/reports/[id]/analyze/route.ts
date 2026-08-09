import { NextRequest, NextResponse } from 'next/server';

/**
 * Report Analyze API Route
 * 
 * Architecture: Vercel serverless → Alibaba Cloud backend
 * Trigger AI analysis for a specific report
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('=== Report Analyze API Route Called ===');
  const { id } = await params;
  console.log('Report ID:', id);
  
  try {
    // Get auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.slice(7);
    const reportId = id;
    
    // Call Alibaba Cloud backend
    const backendUrl = process.env.BACKEND_URL || 'http://106.15.90.140:3001';
    
    const backendResponse = await fetch(`${backendUrl}/api/reports/${reportId}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error:', backendResponse.status, errorText);
      return NextResponse.json(
        { error: `Backend error: ${backendResponse.status}` },
        { status: backendResponse.status }
      );
    }
    
    const data = await backendResponse.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Report Analyze API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}