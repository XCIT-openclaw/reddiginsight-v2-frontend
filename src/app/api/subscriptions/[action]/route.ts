import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  cancelCreemSubscription,
  CreemApiError,
  pauseCreemSubscription,
  resumeCreemSubscription,
  updateCreemSubscription,
  upgradeCreemSubscription,
} from "@/lib/creem";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPPORTED_ACTIONS = new Set([
  "update",
  "upgrade",
  "cancel",
  "pause",
  "resume",
]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;

  if (!SUPPORTED_ACTIONS.has(action)) {
    return NextResponse.json(
      { error: "Unsupported subscription action" },
      { status: 404 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("creem_subscription_id, status, plan_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const subscriptionId = subscription?.creem_subscription_id;
  if (!subscriptionId) {
    return NextResponse.json(
      { error: "No Creem subscription found for this user" },
      { status: 404 }
    );
  }

  let body: Record<string, any> = {};
  if (action !== "pause" && action !== "resume") {
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }
  }

  try {
    let result: unknown;

    switch (action) {
      case "upgrade": {
        const productId = body.product_id || body.productId;
        if (!productId) {
          return NextResponse.json(
            { error: "product_id is required" },
            { status: 400 }
          );
        }
        result = await upgradeCreemSubscription(subscriptionId, {
          productId,
          updateBehavior: body.update_behavior || body.updateBehavior,
        });
        break;
      }

      case "update": {
        const items = Array.isArray(body.items) ? body.items : null;
        if (!items || items.length === 0) {
          return NextResponse.json(
            { error: "items is required" },
            { status: 400 }
          );
        }
        result = await updateCreemSubscription(subscriptionId, {
          items,
          updateBehavior: body.update_behavior || body.updateBehavior,
        });
        break;
      }

      case "cancel": {
        const mode = body.mode === "immediate" ? "immediate" : "scheduled";
        const onExecute =
          body.onExecute === "pause" || body.onExecute === "cancel"
            ? body.onExecute
            : undefined;
        result = await cancelCreemSubscription(subscriptionId, {
          mode,
          onExecute,
        });
        break;
      }

      case "pause":
        result = await pauseCreemSubscription(subscriptionId);
        break;

      case "resume":
        result = await resumeCreemSubscription(subscriptionId);
        break;

      default:
        return NextResponse.json(
          { error: "Unsupported subscription action" },
          { status: 404 }
        );
    }

    return NextResponse.json({ success: true, subscription: result });
  } catch (error) {
    console.error("[Creem Subscription] Action failed:", action, error);

    if (error instanceof CreemApiError) {
      return NextResponse.json(
        {
          error: "Creem API error: " + error.status,
          details: error.details,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: "Subscription change failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
