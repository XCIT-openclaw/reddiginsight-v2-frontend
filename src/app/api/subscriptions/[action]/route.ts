import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { shouldRejectPlanChangeAction } from "@/lib/subscription-state";
import {
  getCreemPlanProductId,
  getPlanIdForCreemProductId,
} from "@/lib/creem-products";
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

function getPlanIdFromBody(action: string, body: Record<string, any>): string | null {
  if (action === "update") {
    const item = Array.isArray(body.items) ? body.items[0] : null;
    const productId =
      typeof item?.product_id === "string"
        ? item.product_id
        : typeof item?.product === "string"
          ? item.product
          : item?.product?.id;
    const mappedPlanId = productId ? getPlanIdForCreemProductId(productId) : null;
    return mappedPlanId || body.plan_id || body.planId || null;
  }

  const productId = body.product_id || body.productId;
  const mappedPlanId = productId ? getPlanIdForCreemProductId(productId) : null;
  return mappedPlanId || body.plan_id || body.planId || null;
}

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

  // Temporary production guard: preserve the plan-change implementation below, but
  // return 503 until Creem resolves the 403 from its plan-change endpoint.
  if (shouldRejectPlanChangeAction(action)) {
    return NextResponse.json(
      {
        error: "Subscription plan changes are temporarily unavailable.",
        details: "Existing subscriptions, purchases, cancellation, and reactivation remain available.",
      },
      { status: 503 }
    );
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("creem_subscription_id, status, plan_id, credits_per_month, pending_plan, plan_change_requested_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const subscriptionId = subscription?.creem_subscription_id;
  if (!subscriptionId) {
    return NextResponse.json(
      { error: "No Creem subscription found for this user" },
      { status: 404 }
    );
  }

  // Terminal subscriptions keep their historical Creem ID, but no lifecycle action
  // or plan change can be performed on them.
  if (subscription?.status === "canceled" || subscription?.status === "expired") {
    return NextResponse.json(
      {
        error: "No active subscription found for this user",
        details: "The existing subscription is already " + subscription.status + ".",
      },
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

  const isPlanChange = action === "upgrade" || action === "update";
  const targetPlan = isPlanChange ? getPlanIdFromBody(action, body) : null;
  const currentPlan = subscription?.plan_id || null;

  if (isPlanChange) {
    if (!targetPlan) {
      return NextResponse.json(
        { error: "A valid target plan is required" },
        { status: 400 }
      );
    }

    if (targetPlan === currentPlan) {
      return NextResponse.json(
        { error: "You are already subscribed to this plan" },
        { status: 400 }
      );
    }

    const isUpgrade = targetPlan === "pro" && currentPlan === "starter";
    const isDowngrade = targetPlan === "starter" && currentPlan === "pro";

    if (!isUpgrade && !isDowngrade) {
      return NextResponse.json(
        { error: "Invalid subscription plan change direction" },
        { status: 400 }
      );
    }

    const requestedUpdateBehavior = body.update_behavior || body.updateBehavior;
    if (requestedUpdateBehavior && requestedUpdateBehavior !== "proration-none") {
      return NextResponse.json(
        {
          error: "Unsupported update behavior",
          details: "Plan changes must take effect at the start of the next billing cycle.",
        },
        { status: 400 }
      );
    }

    if (subscription?.plan_change_requested_at) {
      return NextResponse.json(
        {
          error: "You can only change your subscription plan once per billing cycle.",
          details: "Your next plan change will be available at the start of your next billing cycle.",
        },
        { status: 409 }
      );
    }

    const targetProductId = getCreemPlanProductId(targetPlan);
    if (!targetProductId) {
      return NextResponse.json(
        {
          error: "Subscription products are not configured.",
          details: "Missing CREEM_STARTER_PRODUCT_ID or CREEM_PRO_PRODUCT_ID.",
        },
        { status: 503 }
      );
    }

    // Atomically reserve the one plan-change slot for this billing cycle.
    const requestedAt = new Date().toISOString();
    const claimPayload: Record<string, unknown> = {
      plan_change_requested_at: requestedAt,
      updated_at: requestedAt,
    };

    claimPayload.pending_plan = targetPlan;

    const { data: claimedRows, error: claimError } = await supabase
      .from("subscriptions")
      .update(claimPayload)
      .eq("user_id", user.id)
      .eq("creem_subscription_id", subscriptionId)
      .is("plan_change_requested_at", null)
      .select("id");

    if (claimError || !claimedRows || claimedRows.length === 0) {
      return NextResponse.json(
        {
          error: "You can only change your subscription plan once per billing cycle.",
          details: "Your next plan change will be available at the start of your next billing cycle.",
        },
        { status: 409 }
      );
    }

    const rollbackClaim = async () => {
      const rollbackPayload: Record<string, unknown> = {
        plan_change_requested_at: null,
        pending_plan: null,
        updated_at: new Date().toISOString(),
      };
      await supabase
        .from("subscriptions")
        .update(rollbackPayload)
        .eq("user_id", user.id)
        .eq("creem_subscription_id", subscriptionId);
    };

    try {
      let result: unknown;

      if (action === "upgrade") {
        result = await upgradeCreemSubscription(subscriptionId, {
          productId: targetProductId,
          updateBehavior: "proration-none",
        });
      } else {
        result = await updateCreemSubscription(subscriptionId, {
          items: [{ product_id: targetProductId, units: 1 }],
          updateBehavior: "proration-none",
        });
      }

      return NextResponse.json({
        success: true,
        subscription: result,
        pendingPlan: targetPlan,
        planChangeRequestedAt: requestedAt,
      });
    } catch (error) {
      await rollbackClaim();
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

  try {
    let result: unknown;

    switch (action) {
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

    let nextStatus: string | null = null;
    if (action === "cancel") {
      nextStatus = body.mode === "immediate" ? "canceled" : "scheduled_cancel";
    } else if (action === "pause") {
      nextStatus = "paused";
    } else if (action === "resume") {
      nextStatus = "active";
    }

    if (nextStatus) {
      await supabase.from("subscriptions").update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id).eq("creem_subscription_id", subscriptionId);
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
