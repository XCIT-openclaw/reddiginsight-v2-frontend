import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildPasswordResetRedirect,
  parseResetEmail,
} from "@/lib/password-reset";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = parseResetEmail(body?.email);

    if (!email) {
      return NextResponse.json(
        { message: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: buildPasswordResetRedirect(request.nextUrl.origin),
    });

    if (error) {
      console.error("[forgot-password] Supabase reset email failed:", error.message);
      return NextResponse.json(
        { message: "Unable to send the reset email. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[forgot-password] Unexpected error:", error);
    return NextResponse.json(
      { message: "Unable to send the reset email. Please try again." },
      { status: 500 }
    );
  }
}
