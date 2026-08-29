import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import {
  shouldResetUserAfterTerminalSubscription,
} from "@/lib/subscription-state";
import {
  getPlanIdForCreemProductId,
  PAID_PLAN_CREDITS,
} from "@/lib/creem-products";
import {
  getCreemCheckoutSubscriptionId,
  getCreemCustomerId,
  getCreemRefundAmount,
  getCreemSubscription,
  getCreemSubscriptionCustomerEmail,
  getCreemSubscriptionUserId,
  getCreemTransaction,
  getCreemTransactionAmount,
  getCreemTransactionId,
  updateCreemCustomerMetadata,
  updateCreemCustomerMetadataByEmail,
} from "@/lib/creem";

function getEventProductId(eventObject: Record<string, any>): string | null {
  const firstItem = Array.isArray(eventObject.items) ? eventObject.items[0] : null;
  return (
    (typeof eventObject.product === "string" ? eventObject.product : null) ||
    (eventObject.product && typeof eventObject.product.id === "string" ? eventObject.product.id : null) ||
    (typeof eventObject.product_id === "string" ? eventObject.product_id : null) ||
    (firstItem && typeof firstItem.product_id === "string" ? firstItem.product_id : null) ||
    (firstItem && typeof firstItem.product === "string" ? firstItem.product : null) ||
    (firstItem && firstItem.product && typeof firstItem.product.id === "string" ? firstItem.product.id : null) ||
    null
  );
}

function getEventPlanId(eventObject: Record<string, any>): string | null {
  const productId = getEventProductId(eventObject);
  return (
    (productId ? getPlanIdForCreemProductId(productId) : null) ||
    (typeof eventObject.metadata?.plan_id === "string" ? eventObject.metadata.plan_id : null) ||
    null
  );
}

function getEventCustomerEmail(eventObject: Record<string, any>): string | null {
  const customer = eventObject.customer;
  if (customer && typeof customer === "object" && typeof customer.email === "string") {
    return customer.email;
  }
  return typeof eventObject.customer_email === "string" ? eventObject.customer_email : null;
}

const ACTIVE_LOCAL_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "paused",
  "scheduled_cancel",
  "unpaid",
]);

async function resetUserAfterTerminalSubscriptionIfSafe(
  supabase: any,
  eventObject: Record<string, any>,
  knownUserId?: string | null
): Promise<boolean> {
  let userId = knownUserId || eventObject.metadata?.user_id || null;

  if (userId) {
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (!existingUser?.id) userId = null;
  }

  if (!userId) {
    let remoteSubscription: Record<string, any> | null = null;
    const subscriptionId = typeof eventObject.id === "string" ? eventObject.id : null;
    if (subscriptionId) {
      try {
        remoteSubscription = await getCreemSubscription(subscriptionId);
      } catch (subscriptionLookupError) {
        console.warn("[Creem Webhook] Terminal subscription lookup failed", {
          subscriptionId,
          subscriptionLookupError,
        });
      }
    }

    const remoteUserId = remoteSubscription
      ? getCreemSubscriptionUserId(remoteSubscription)
      : null;
    if (remoteUserId) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("id", remoteUserId)
        .maybeSingle();
      if (existingUser?.id) userId = existingUser.id;
    }

    if (!userId) {
      const customerEmail =
        getEventCustomerEmail(eventObject) ||
        (remoteSubscription
          ? getCreemSubscriptionCustomerEmail(remoteSubscription)
          : null);
      if (customerEmail) {
        const { data: existingUser } = await supabase
          .from("users")
          .select("id, email")
          .ilike("email", customerEmail);
        userId =
          existingUser?.find(
            (candidate: { id: string; email: string }) =>
              candidate.email?.toLowerCase() === customerEmail.toLowerCase()
          )?.id || null;
      }
    }

    if (!userId && remoteSubscription) {
      const remoteCustomerId = getCreemCustomerId(remoteSubscription);
      if (remoteCustomerId) {
        eventObject.customer_id = remoteCustomerId;
      }
      if (remoteSubscription.customer && typeof remoteSubscription.customer === "object") {
        eventObject.customer = remoteSubscription.customer;
      }
    }
  }

  if (!userId) {
    console.error("[Creem Webhook] Terminal subscription reset could not resolve user", {
      subscriptionId: eventObject.id,
    });
    return false;
  }

  const { data: userSubscriptions } = await supabase
    .from("subscriptions")
    .select("id, status, creem_subscription_id")
    .eq("user_id", userId);

  const terminalCreemSubscriptionId =
    typeof eventObject.id === "string" ? eventObject.id : null;
  if (
    !shouldResetUserAfterTerminalSubscription(
      userSubscriptions || [],
      terminalCreemSubscriptionId
    )
  ) {
    console.warn("[Creem Webhook] Terminal subscription reset blocked because another active subscription exists", {
      userId,
      subscriptionId: eventObject.id,
      subscriptionStates: userSubscriptions?.map((subscription: any) => ({
        id: subscription.id,
        status: subscription.status,
        creemSubscriptionId: subscription.creem_subscription_id,
      })) || [],
    });
    return false;
  }

  await supabase.from("users").update({
    credits: 0,
    plan: "free",
    updated_at: new Date().toISOString(),
  }).eq("id", userId);

  await syncCustomerMetadata(supabase, eventObject, userId, "free", 0);
  console.log("[Creem Webhook] Terminal subscription reset user to Free:", {
    userId,
    subscriptionId: eventObject.id,
  });
  return true;
}

async function hasConflictingActiveSubscription(
  supabase: any,
  userId: string | null,
  incomingSubscriptionId: string | null,
  eventType: string
): Promise<boolean> {
  if (!userId || !incomingSubscriptionId) return false;

  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("id, status, creem_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();

  const existingSubscriptionId = existingSubscription?.creem_subscription_id || null;
  if (
    !existingSubscription?.id ||
    !existingSubscriptionId ||
    existingSubscriptionId === incomingSubscriptionId ||
    !ACTIVE_LOCAL_SUBSCRIPTION_STATUSES.has(existingSubscription.status)
  ) {
    return false;
  }

  console.error("[Creem Webhook] Blocked a different active subscription from overwriting local state:", {
    eventType,
    userId,
    incomingSubscriptionId,
    existingSubscriptionId,
    existingStatus: existingSubscription.status,
  });
  return true;
}


async function syncCustomerMetadata(
  supabase: any,
  eventObject: Record<string, any>,
  userId: string,
  planId: string,
  credits: number
): Promise<void> {
  try {
    const eventCustomerId = getCreemCustomerId(eventObject);
    const metadata = {
      plan_id: planId,
      credits,
      user_id: userId,
    };

    const { data: user } = await supabase
      .from("users")
      .select("email")
      .eq("id", userId)
      .maybeSingle();

    if (eventCustomerId) {
      try {
        await updateCreemCustomerMetadata(eventCustomerId, metadata);
        return;
      } catch (eventCustomerError) {
        // Synthetic or stale webhook payloads can reference a customer that does not
        // exist in this Creem environment. Fall back to the registered account email.
        console.warn("[Creem Webhook] Event customer metadata sync failed; retrying by email", {
          userId,
          eventCustomerId,
          planId,
          eventCustomerError,
        });
      }
    }

    if (user?.email) {
      const metadataSynced = await updateCreemCustomerMetadataByEmail(user.email, metadata);
      if (!metadataSynced) {
        console.error("[Creem Webhook] Customer metadata sync skipped: customer not found", {
          userId,
          email: user.email,
          planId,
        });
      }
      return;
    }

    console.error("[Creem Webhook] Customer metadata sync skipped: user email missing", {
      userId,
      planId,
    });
  } catch (metadataError) {
    console.error("[Creem Webhook] Customer metadata sync failed:", {
      userId,
      planId,
      metadataError,
    });
  }
}

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
        const credits = Number(metadata.credits) || PAID_PLAN_CREDITS[planId] || 0;
        const orderId = eventObject.order?.id || eventObject.id;

        console.log("[Creem Webhook] checkout.completed:", { userId, planId, credits, orderId });

        if (!userId) {
          console.error("[Creem Webhook] Missing user_id in metadata");
          break;
        }

        // Recurring subscriptions are credited only by subscription.paid.
        // Creem sends checkout.completed + subscription.paid for the initial charge,
        // so granting credits here would double-count the same purchase.
        const checkoutSubscriptionId = getCreemCheckoutSubscriptionId(eventObject);
        if (checkoutSubscriptionId) {
          const subObj =
            eventObject.subscription && typeof eventObject.subscription === "object"
              ? eventObject.subscription
              : {};
          const subId = checkoutSubscriptionId;
          if (subId) {
            if (await hasConflictingActiveSubscription(supabase, userId, subId, eventType)) {
              break;
            }
            await supabase.from("subscriptions").upsert({
              user_id: userId,
              plan_id: planId,
              creem_subscription_id: subId,
              status: "active",
              credits_per_month: credits,
              current_period_end: subObj.current_period_end_date || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });
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
        let subUserId = eventObject.metadata?.user_id || null;
        if (!subUserId && subId) {
          const { data: existingBySubId } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("creem_subscription_id", subId)
            .maybeSingle();
          subUserId = existingBySubId?.user_id || null;
        }

        if (subUserId && subId) {
          if (await hasConflictingActiveSubscription(supabase, subUserId, subId, eventType)) {
            break;
          }
          const { data: existingSub } = await supabase
            .from("subscriptions")
            .select("id, plan_id, credits_per_month, pending_plan, plan_change_requested_at")
            .eq("user_id", subUserId)
            .maybeSingle();

          const productId = typeof eventObject.product === "string" ? eventObject.product : eventObject.product?.id;
          const eventPlanId =
            (productId ? getPlanIdForCreemProductId(productId) : null) ||
            eventObject.metadata?.plan_id ||
            "starter";
          const now = new Date().toISOString();

          if (!existingSub?.id) {
            await supabase.from("subscriptions").upsert({
              user_id: subUserId,
              plan_id: eventPlanId,
              creem_subscription_id: subId,
              status: eventObject.status || "active",
              credits_per_month: PAID_PLAN_CREDITS[eventPlanId] || 0,
              current_period_end: eventObject.current_period_end_date || now,
              updated_at: now,
            }, { onConflict: "user_id" });
            await syncCustomerMetadata(supabase, eventObject, subUserId, eventPlanId, PAID_PLAN_CREDITS[eventPlanId] || 0);
            break;
          }

          // A next-cycle plan change may already be stored locally. The Creem object can
          // expose the next product immediately under proration-none, so activation must
          // not replace the user's current-cycle plan or credits.
          const hasScheduledPlanChange = Boolean(existingSub.pending_plan);
          const activePlanId = hasScheduledPlanChange
            ? existingSub.plan_id || eventPlanId
            : eventPlanId;
          const activeCredits = hasScheduledPlanChange
            ? existingSub.credits_per_month ?? (PAID_PLAN_CREDITS[activePlanId] || 0)
            : PAID_PLAN_CREDITS[activePlanId] || 0;

          const activeUpdate: Record<string, unknown> = {
            plan_id: activePlanId,
            credits_per_month: activeCredits,
            status: eventObject.status || "active",
            updated_at: now,
          };
          if (eventObject.current_period_start_date) {
            activeUpdate.current_period_start = eventObject.current_period_start_date;
          }
          if (eventObject.current_period_end_date) {
            activeUpdate.current_period_end = eventObject.current_period_end_date;
          }

          await supabase.from("subscriptions").update(activeUpdate).eq("id", existingSub.id);

          // Keep users.plan aligned when Creem reactivates a subscription from its dashboard.
          // Do not overwrite credits here: this cycle's remaining balance must be preserved.
          await supabase.from("users").update({
            plan: activePlanId,
            updated_at: now,
          }).eq("id", subUserId);

          await syncCustomerMetadata(supabase, eventObject, subUserId, activePlanId, activeCredits);
        }
        break;
      }

      case "subscription.paid": {
        const subId = eventObject.id;
        const planId = getEventPlanId(eventObject) || "starter";
        const subCredits = PAID_PLAN_CREDITS[planId] || 0;
        const paymentId = eventObject.last_transaction_id || eventObject.transaction?.id || eventObject.payment_id || subId;

        console.log("[Creem Webhook] subscription.paid:", { subId, planId, subCredits, paymentId });

        let subUserId = eventObject.metadata?.user_id || null;
        if (!subUserId && subId) {
          const { data: existingBySubId } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("creem_subscription_id", subId)
            .maybeSingle();
          subUserId = existingBySubId?.user_id || null;
        }

        const eventCustomerEmail = getEventCustomerEmail(eventObject);
        if (!subUserId && eventCustomerEmail) {
          const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("email", eventCustomerEmail)
            .maybeSingle();
          subUserId = existingUser?.id || null;
          if (subUserId) {
            console.log("[Creem Webhook] subscription.paid resolved user by customer email:", {
              subId,
              userId: subUserId,
            });
          }
        }

        if (!subUserId) {
          console.error("[Creem Webhook] subscription.paid missing user_id:", {
            subId,
            eventCustomerEmail: Boolean(eventCustomerEmail),
          });
          break;
        }

        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("id, user_id, plan_id, credits_per_month, current_period_start, current_period_end, pending_plan, plan_change_requested_at")
          .eq("user_id", subUserId)
          .maybeSingle();

        if (await hasConflictingActiveSubscription(supabase, subUserId, subId, eventType)) {
          break;
        }

        const { data: existingTx } = await supabase
          .from("transactions")
          .select("id")
          .eq("payment_id", paymentId)
          .maybeSingle();

        if (existingTx) {
          console.log("[Creem Webhook] subscription.paid already processed:", paymentId);
          const currentPlanId = existingSub?.plan_id || planId;
          const currentCredits = existingSub?.credits_per_month ?? subCredits;
          await syncCustomerMetadata(supabase, eventObject, subUserId, currentPlanId, currentCredits);
          break;
        }

        let transactionAmount: number | null = null;
        try {
          const transaction = await getCreemTransaction(paymentId);
          transactionAmount = getCreemTransactionAmount(transaction);
          console.log("[Creem Webhook] subscription.paid transaction amount:", {
            paymentId,
            transactionAmount,
          });
        } catch (transactionError) {
          console.error("[Creem Webhook] Failed to load subscription transaction amount:", {
            paymentId,
            transactionError,
          });
        }

        const now = new Date().toISOString();
        const eventPeriodStart = eventObject.current_period_start_date || eventObject.current_period_start || null;
        const eventPeriodEnd = eventObject.current_period_end_date || eventObject.current_period_end || null;
        const nextTransactionDate = eventObject.next_transaction_date || null;
        const storedPeriodEnd = existingSub?.current_period_end || null;
        const billingAnchor = nextTransactionDate || null;

        // Paid events represent the start of a billing cycle. Plan changes use
        // proration-none, so every paid plan receives its full monthly credit allowance.
        const isNewBillingPeriod =
          Boolean(billingAnchor) &&
          Boolean(storedPeriodEnd) &&
          new Date(billingAnchor).getTime() > new Date(storedPeriodEnd).getTime();

        console.log("[Creem Webhook] subscription.paid period check:", {
          subId,
          eventPeriodStart,
          eventPeriodEnd,
          nextTransactionDate,
          storedPeriodEnd,
          isNewBillingPeriod,
        });

        const scheduledPendingPlan = existingSub?.pending_plan || null;
        const existingPlanId = existingSub?.plan_id || null;
        const isScheduledPlanChange =
          Boolean(existingSub?.plan_change_requested_at) &&
          Boolean(scheduledPendingPlan) &&
          scheduledPendingPlan === planId &&
          existingPlanId !== planId;

        const shouldClearPlanChange = isNewBillingPeriod || isScheduledPlanChange;
        const nextPendingPlan = shouldClearPlanChange ? null : (existingSub?.pending_plan ?? null);
        const nextPlanChangeRequestedAt = shouldClearPlanChange ? null : (existingSub?.plan_change_requested_at ?? null);

        await supabase.from("users").update({
          plan: planId,
          credits: subCredits,
          updated_at: now,
        }).eq("id", subUserId);

        await syncCustomerMetadata(supabase, eventObject, subUserId, planId, subCredits);

        await supabase.from("subscriptions").upsert({
          user_id: subUserId,
          plan_id: planId,
          creem_subscription_id: subId,
          status: "active",
          credits_per_month: subCredits,
          current_period_start: eventPeriodStart || existingSub?.current_period_start || now,
          current_period_end: eventObject.current_period_end_date || eventObject.current_period_end || existingSub?.current_period_end || now,
          pending_plan: nextPendingPlan,
          plan_change_requested_at: nextPlanChangeRequestedAt,
          updated_at: now,
        }, { onConflict: "user_id" });

        await supabase.from("transactions").insert({
          user_id: subUserId,
          amount: transactionAmount ?? 0,
          credits: subCredits,
          payment_method: "creem",
          payment_id: paymentId,
          status: "completed",
          completed_at: now,
        });

        console.log("[Creem Webhook] subscription.paid credited:", { subUserId, planId, transactionCredits: subCredits, paymentId, isNewBillingPeriod, shouldClearPlanChange });
        break;
      }

      case "subscription.update": {
        const subId = eventObject.id;
        const targetPlanId = getEventPlanId(eventObject);
        const targetCredits = targetPlanId ? (PAID_PLAN_CREDITS[targetPlanId] ?? null) : null;

        console.log("[Creem Webhook] subscription.update:", { subId, targetPlanId, targetCredits });

        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("id, user_id, plan_id, credits_per_month, current_period_start, current_period_end, pending_plan, plan_change_requested_at")
          .eq("creem_subscription_id", subId)
          .maybeSingle();

        const now = new Date().toISOString();

        // Initial subscription sync must not consume the one-plan-change slot.
        if (!existingSub?.id) {
          if (subId) {
            const subUserId = eventObject.metadata?.user_id || null;
            if (subUserId) {
              if (await hasConflictingActiveSubscription(supabase, subUserId, subId, eventType)) {
                break;
              }
              await supabase.from("subscriptions").upsert({
                user_id: subUserId,
                plan_id: targetPlanId || "starter",
                creem_subscription_id: subId,
                status: "active",
                credits_per_month: targetCredits ?? PAID_PLAN_CREDITS[targetPlanId || "starter"] ?? 0,
                current_period_start: eventObject.current_period_start_date || null,
                current_period_end: eventObject.current_period_end_date || now,
                pending_plan: null,
                plan_change_requested_at: null,
                updated_at: now,
              }, { onConflict: "user_id" });
            } else {
              const initialPayload: Record<string, unknown> = {
                plan_id: targetPlanId || "starter",
                credits_per_month: targetCredits ?? PAID_PLAN_CREDITS[targetPlanId || "starter"] ?? 0,
                current_period_start: eventObject.current_period_start_date || null,
                current_period_end: eventObject.current_period_end_date || now,
                pending_plan: null,
                plan_change_requested_at: null,
                updated_at: now,
              };
              await supabase.from("subscriptions").update(initialPayload).eq("creem_subscription_id", subId);
            }
          }
          break;
        }

        const currentPlan = existingSub?.plan_id || null;
        const isInitialSync = Boolean(existingSub?.id) && !currentPlan && Boolean(targetPlanId);
        if (isInitialSync) {
          await supabase.from("subscriptions").update({
            plan_id: targetPlanId,
            credits_per_month: targetCredits ?? PAID_PLAN_CREDITS[targetPlanId || "starter"] ?? 0,
            pending_plan: null,
            plan_change_requested_at: null,
            updated_at: now,
          }).eq("id", existingSub.id);
          break;
        }

        const isUpgrade = targetPlanId === "pro" && currentPlan === "starter";
        const isDowngrade = targetPlanId === "starter" && currentPlan === "pro";

        const updatePayload: Record<string, unknown> = {
          updated_at: now,
        };
        if (eventObject.current_period_start_date) {
          updatePayload.current_period_start = eventObject.current_period_start_date;
        }
        if (eventObject.current_period_end_date) {
          updatePayload.current_period_end = eventObject.current_period_end_date;
        }

        if (isUpgrade || isDowngrade) {
          updatePayload.pending_plan = targetPlanId;
          updatePayload.plan_change_requested_at = existingSub?.plan_change_requested_at || now;
        } else if (targetPlanId && targetPlanId !== currentPlan) {
          // Unknown direction safety: keep the current active plan and record the target as pending.
          updatePayload.pending_plan = targetPlanId;
          updatePayload.plan_change_requested_at = existingSub?.plan_change_requested_at || now;
        }

        if (existingSub?.id) {
          await supabase.from("subscriptions").update(updatePayload).eq("id", existingSub.id);
        } else if (subId) {
          await supabase.from("subscriptions").update(updatePayload).eq("creem_subscription_id", subId);
        }

        if (existingSub?.user_id && targetPlanId) {
          await syncCustomerMetadata(
            supabase,
            eventObject,
            existingSub.user_id,
            isUpgrade || isDowngrade ? currentPlan : targetPlanId,
            isUpgrade || isDowngrade
              ? PAID_PLAN_CREDITS[currentPlan] ?? 0
              : targetCredits ?? PAID_PLAN_CREDITS[targetPlanId] ?? 0
          );
        }

        break;
      }

      case "subscription.canceled": {
        const subId = eventObject.id;
        console.log("[Creem Webhook] Subscription canceled (terminal):", subId);
        if (subId) {
          const now = new Date().toISOString();
          await supabase.from("subscriptions").update({
            status: "canceled",
            plan_id: "free",
            credits_per_month: null,
            pending_plan: null,
            plan_change_requested_at: null,
            updated_at: now,
          }).eq("creem_subscription_id", subId);

          const { data: canceledSub } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("creem_subscription_id", subId)
            .maybeSingle();

          if (canceledSub?.user_id) {
            await resetUserAfterTerminalSubscriptionIfSafe(supabase, eventObject, canceledSub.user_id);
          } else {
            await resetUserAfterTerminalSubscriptionIfSafe(supabase, eventObject);
          }
        }
        break;
      }

      case "subscription.paused":
      case "subscription.scheduled_cancel":
      case "subscription.past_due": {
        const subId = eventObject.id;
        console.log("[Creem Webhook] Subscription lifecycle:", eventType, subId);
        if (subId) {
          const statusMap: Record<string, string> = {
            "subscription.paused": "paused",
            "subscription.past_due": "past_due",
            "subscription.scheduled_cancel": "scheduled_cancel",
          };
          const newStatus = statusMap[eventType] || eventObject.status || "active";
          await supabase.from("subscriptions").update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          }).eq("creem_subscription_id", subId);
        }
        break;
      }

      case "subscription.unpaid": {
        const subId = eventObject.id;
        const now = new Date().toISOString();
        console.log("[Creem Webhook] subscription.unpaid (terminal):", subId);
        if (subId) {
          await supabase.from("subscriptions").update({
            status: "unpaid",
            plan_id: "free",
            credits_per_month: null,
            pending_plan: null,
            plan_change_requested_at: null,
            updated_at: now,
          }).eq("creem_subscription_id", subId);

          const { data: unpaidSub } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("creem_subscription_id", subId)
            .maybeSingle();

          if (unpaidSub?.user_id) {
            await resetUserAfterTerminalSubscriptionIfSafe(
              supabase,
              eventObject,
              unpaidSub.user_id
            );
          } else {
            await resetUserAfterTerminalSubscriptionIfSafe(supabase, eventObject);
          }
        }
        break;
      }

      case "subscription.expired": {
        const subId = eventObject.id;
        console.log("[Creem Webhook] subscription.expired:", subId);
        if (subId) {
          await supabase.from("subscriptions").update({
            status: "expired",
            plan_id: "free",
            credits_per_month: null,
            pending_plan: null,
            plan_change_requested_at: null,
            updated_at: new Date().toISOString(),
          }).eq("creem_subscription_id", subId);
          // Reset credits to 0 on expiry
          const { data: expiredSub } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("creem_subscription_id", subId)
            .single();
          if (expiredSub?.user_id) {
            await resetUserAfterTerminalSubscriptionIfSafe(
              supabase,
              eventObject,
              expiredSub.user_id
            );
          } else {
            await resetUserAfterTerminalSubscriptionIfSafe(supabase, eventObject);
          }
        }
        break;
      }

      case "refund.created": {
        const refundId = eventObject.id;
        const paymentId =
          getCreemTransactionId(eventObject) ||
          eventObject.subscription_id ||
          null;
        console.log("[Creem Webhook] Refund created:", {
          refundId,
          paymentId,
          refundObjectKeys: Object.keys(eventObject).join(","),
          refundPreview: JSON.stringify(eventObject).slice(0, 500),
        });

        if (!paymentId) {
          console.error("[Creem Webhook] Refund webhook received but no transaction reference found");
          break;
        }

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
              amount: getCreemRefundAmount(eventObject) ?? 0,
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
