import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const PLAN_CREDITS: Record<string, number> = {
  starter: 10,
  pro: 30,
};

// Creem product ID to plan name mapping
const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_22VvlqddlgnK8O0hHY6kLU": "starter",
  "prod_7ArQ4AAhRf4LVsIGiE8IgJ": "pro",
};

function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) {
    console.error("[Creem Webhook] Missing signature or secret", { hasSignature: !!signature, hasSecret: !!secret });
    return false;
  }
  try {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    const digest = hmac.digest("hex");
    console.log("[Creem Webhook] Signature verify: expected", digest);
    console.log("[Creem Webhook] Signature verify: received", signature);
    console.log("[Creem Webhook] Signature verify: lengths", digest.length, signature.length);
    // Guard against length mismatch (timingSafeEqual throws on unequal lengths)
    if (digest.length !== signature.length) {
      console.error("[Creem Webhook] Signature length mismatch");
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(digest, "utf8"), Buffer.from(signature, "utf8"));
  } catch (err) {
    console.error("[Creem Webhook] Signature verification error:", err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    // Creem official docs: header is "creem-signature" (no x- prefix)
    const signature = request.headers.get("creem-signature");
    const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;

    console.log("[Creem Webhook] Payload length:", payload.length);
    console.log("[Creem Webhook] Payload preview:", payload.substring(0, 200));
    console.log("[Creem Webhook] Secret set:", webhookSecret ? "yes (length " + webhookSecret.length + ")" : "NO");

    if (webhookSecret && webhookSecret !== "your-webhook-secret-here") {
      if (!verifySignature(payload, signature, webhookSecret)) {
        console.error("[Creem Webhook] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
      console.log("[Creem Webhook] Signature verified OK");
    } else {
      console.log("[Creem Webhook] DEV mode - signature verification skipped");
    }

    const event = JSON.parse(payload);
    // Creem webhook payload: eventType + object (handle type/data as fallback for safety)
    const eventType = event.eventType || event.type;
    const eventObject = event.object || event.data || {};

    console.log("[Creem Webhook] Event type:", eventType, "Object id:", eventObject.id);
    console.log("[Creem Webhook] Event keys:", Object.keys(event).join(", "));

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    switch (eventType) {

      case "checkout.completed": {
        const metadata = eventObject.metadata || {};
        const userId = metadata.user_id;
        const planId = metadata.plan_id || "starter";
        const credits = Number(metadata.credits) || PLAN_CREDITS[planId] || 0;
        const orderId = eventObject.order?.id || eventObject.id;

        console.log("[Creem Webhook] checkout.completed:", { userId, planId, credits, orderId });

        if (!userId) {
          console.error("[Creem Webhook] Missing user_id in metadata");
          break;
        }

        // Recurring subscriptions are credited only by subscription.paid.
        // Creem sends checkout.completed + subscription.paid for the initial charge,
        // so granting credits here would double-count the same purchase.
        if (eventObject.subscription) {
          const subObj = eventObject.subscription;
          const subId = typeof subObj === "string" ? subObj : subObj.id;
          if (subId) {
            await supabase.from("subscriptions").upsert({
              user_id: userId,
              plan_id: planId,
              creem_subscription_id: subId,
              status: "active",
              credits_per_month: credits,
              current_period_end: subObj.current_period_end_date || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: "creem_subscription_id" });
          }
          console.log("[Creem Webhook] checkout.completed is recurring; deferring credits to subscription.paid:", subId);
          break;
        }

        // Dedup: check if this order was already processed
        const { data: existingTx } = await supabase
          .from("transactions")
          .select("id")
          .eq("payment_id", orderId)
          .maybeSingle();

        if (existingTx) {
          console.log("[Creem Webhook] Order already processed, skipping:", orderId);
          break;
        }

        // Insert transaction record
        await supabase.from("transactions").insert({
          user_id: userId,
          amount: eventObject.amount ? eventObject.amount / 100 : 0,
          credits: credits,
          payment_method: "creem",
          payment_id: orderId,
          status: "completed",
          completed_at: new Date().toISOString(),
        });

        // Add credits to user (accumulate on first purchase)
        const { data: user } = await supabase.from("users").select("credits").eq("id", userId).single();
        if (user) {
          await supabase.from("users").update({
            credits: (user.credits || 0) + credits,
            plan: planId,
            updated_at: new Date().toISOString(),
          }).eq("id", userId);
          console.log("[Creem Webhook] Credits added:", credits, "New total:", (user.credits || 0) + credits);
        }

        console.log("[Creem Webhook] checkout.completed processed for user:", userId);
        break;
      }

      case "subscription.active":
      case "subscription.trialing": {
        const subId = eventObject.id;
        console.log("[Creem Webhook] subscription.active/trialing:", subId);
        const subUserId = eventObject.metadata?.user_id;
        if (subUserId && subId) {
          const productId = typeof eventObject.product === "string" ? eventObject.product : eventObject.product?.id;
          const planId = eventObject.metadata?.plan_id || PRODUCT_TO_PLAN[productId] || "starter";
          await supabase.from("subscriptions").upsert({
            user_id: subUserId,
            plan_id: planId,
            creem_subscription_id: subId,
            status: eventObject.status || "active",
            credits_per_month: PLAN_CREDITS[planId] || 0,
            current_period_end: eventObject.current_period_end_date || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: "creem_subscription_id" });
        }
        break;
      }

      case "subscription.paid": {
        const subId = eventObject.id;
        console.log("[Creem Webhook] subscription.paid:", subId);

        const firstPaidItem = Array.isArray(eventObject.items) ? eventObject.items[0] : null;
        const itemProductId =
          typeof firstPaidItem?.product_id === "string"
            ? firstPaidItem.product_id
            : typeof firstPaidItem?.product === "string"
              ? firstPaidItem.product
              : firstPaidItem?.product?.id;
        const productId =
          typeof eventObject.product === "string"
            ? eventObject.product
            : eventObject.product?.id || eventObject.product_id || itemProductId;
        const planId = eventObject.metadata?.plan_id || PRODUCT_TO_PLAN[productId] || "starter";
        const subCredits = PLAN_CREDITS[planId] || 0;

        let subUserId = eventObject.metadata?.user_id || null;
        if (!subUserId && subId) {
          const { data: existingSub } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("creem_subscription_id", subId)
            .single();
          if (existingSub) subUserId = existingSub.user_id;
        }

        if (subUserId) {
          // Dedup check
          const { data: existingTx } = await supabase
            .from("transactions")
            .select("id")
            .eq("payment_id", subId)
            .maybeSingle();

          if (!existingTx) {
            // Reset credits for new billing period (not accumulate)
            await supabase.from("users").update({
              plan: planId,
              credits: subCredits,
              updated_at: new Date().toISOString(),
            }).eq("id", subUserId);

            await supabase.from("subscriptions").upsert({
              user_id: subUserId,
              plan_id: planId,
              creem_subscription_id: subId,
              status: "active",
              credits_per_month: subCredits,
              current_period_end: eventObject.current_period_end_date || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: "creem_subscription_id" });

            await supabase.from("transactions").insert({
              user_id: subUserId,
              amount: eventObject.amount ? eventObject.amount / 100 : 0,
              credits: subCredits,
              payment_method: "creem",
              payment_id: subId,
              status: "completed",
              completed_at: new Date().toISOString(),
            });

            console.log("[Creem Webhook] Credits reset for new period:", subCredits, "user:", subUserId);
          } else {
            console.log("[Creem Webhook] subscription.paid already processed:", subId);
          }
        }
        break;
      }

      case "subscription.update": {
        const subId = eventObject.id;
        const firstUpdateItem = Array.isArray(eventObject.items) ? eventObject.items[0] : null;
        const updateItemProductId =
          typeof firstUpdateItem?.product_id === "string"
            ? firstUpdateItem.product_id
            : typeof firstUpdateItem?.product === "string"
              ? firstUpdateItem.product
              : firstUpdateItem?.product?.id;
        const productId =
          typeof eventObject.product === "string"
            ? eventObject.product
            : eventObject.product?.id || eventObject.product_id || updateItemProductId;
        const planId = eventObject.metadata?.plan_id || PRODUCT_TO_PLAN[productId];
        const planCredits = planId ? PLAN_CREDITS[planId] : null;

        console.log("[Creem Webhook] subscription.update:", { subId, productId, planId, planCredits });

        if (subId) {
          const updatePayload: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          };
          if (planId) updatePayload.plan_id = planId;
          if (planCredits !== null && planCredits !== undefined) updatePayload.credits_per_month = planCredits;
          if (eventObject.current_period_end_date) updatePayload.current_period_end = eventObject.current_period_end_date;
          await supabase.from("subscriptions").update(updatePayload).eq("creem_subscription_id", subId);
        }
        break;
      }

      case "subscription.canceled":
      case "subscription.paused":
      case "subscription.scheduled_cancel":
      case "subscription.past_due":
      case "subscription.unpaid": {
        const subId = eventObject.id;
        console.log("[Creem Webhook] Subscription lifecycle:", eventType, subId);
        if (subId) {
          const statusMap: Record<string, string> = {
            "subscription.canceled": "canceled",
            "subscription.paused": "paused",
            "subscription.past_due": "past_due",
            "subscription.scheduled_cancel": "scheduled_cancel",
            "subscription.unpaid": "unpaid",
          };
          const newStatus = statusMap[eventType] || eventObject.status || "active";
          await supabase.from("subscriptions").update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          }).eq("creem_subscription_id", subId);
        }
        break;
      }

      case "subscription.expired": {
        const subId = eventObject.id;
        console.log("[Creem Webhook] subscription.expired:", subId);
        if (subId) {
          await supabase.from("subscriptions").update({
            status: "expired",
            updated_at: new Date().toISOString(),
          }).eq("creem_subscription_id", subId);
          // Reset credits to 0 on expiry
          const { data: expiredSub } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("creem_subscription_id", subId)
            .single();
          if (expiredSub?.user_id) {
            await supabase.from("users").update({
              credits: 0,
              plan: "free",
              updated_at: new Date().toISOString(),
            }).eq("id", expiredSub.user_id);
            console.log("[Creem Webhook] Credits reset to 0 for expired subscription, user:", expiredSub.user_id);
          }
        }
        break;
      }

      case "refund.created": {
        const refundId = eventObject.id;
        const paymentId = eventObject.payment_id || eventObject.subscription_id;
        console.log("[Creem Webhook] Refund created:", refundId, "for payment:", paymentId);

        const { data: tx } = await supabase.from("transactions")
          .select("user_id, credits")
          .eq("payment_id", paymentId)
          .single();

        if (tx) {
          const { data: existingRefund } = await supabase
            .from("transactions")
            .select("id")
            .eq("payment_id", refundId)
            .maybeSingle();

          if (!existingRefund) {
            await supabase.from("transactions").insert({
              user_id: tx.user_id,
              amount: -(eventObject.amount ? eventObject.amount / 100 : 0),
              credits: -tx.credits,
              payment_method: "creem",
              payment_id: refundId,
              status: "refunded",
            });

            const { data: user } = await supabase.from("users").select("credits").eq("id", tx.user_id).single();
            if (user) {
              await supabase.from("users").update({
                credits: Math.max(0, (user.credits || 0) - tx.credits),
                updated_at: new Date().toISOString(),
              }).eq("id", tx.user_id);
            }
            console.log("[Creem Webhook] Refund processed, deducted:", tx.credits, "credits");
          }
        }
        break;
      }

      case "dispute.created": {
        console.log("[Creem Webhook] Dispute created:", eventObject.id);
        break;
      }

      default:
        console.log("[Creem Webhook] Unhandled event type:", eventType, JSON.stringify(event).substring(0, 300));
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Creem Webhook] Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}