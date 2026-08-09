import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;



export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;
    const authHeader = request.headers.get("Authorization");
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const backendUrl = process.env.BACKEND_URL || "http://106.15.90.140:3001";
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(backendUrl + "/api/reports/" + reportId + "/progress", {
      signal: controller.signal,
      headers: token ? { Authorization: "Bearer " + token } : {}
    });
    clearTimeout(timeout);
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}