import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const backendUrl = process.env.BACKEND_URL || "http://106.15.90.140:3001";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization header required" }, { status: 401 });
    }

    const backendResponse = await fetch(`${backendUrl}/api/chat/status/${taskId}`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
      signal: AbortSignal.timeout(10000),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Chat status error:", error?.message);
    return NextResponse.json(
      { error: `Internal server error: ${error?.message || "Unknown"}` },
      { status: 500 }
    );
  }
}