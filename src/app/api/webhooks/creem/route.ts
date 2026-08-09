import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PLAN_CREDITS: Record<string, number> = {
  starter: 10,
  pro: 30,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function addCreditsToUser(
  supabase: any,
  userId: string,
  planId: string,
  subscriptionId: string,
  periodStart: string,
  periodEnd: string
) {
  const credits = PLAN_CREDITS[planId] || 0;

  const { error: userError } = await supabase
    .from("users")
    .update({
      plan: planId,
      credits: credits,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (userError) {
    console.error("Failed to update user credits:", userError);
    throw userError;
  }

  const { error: subError } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        plan_id: planId,
        creem_subscription_id: subscriptionId,
        status: "active",
        credits_per_month: credits,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (subError) {
    console.error("Failed to upsert subscription:", subError);
  }

  console.log(`Credits set: ${credits} for user ${userId} (plan: ${planId})`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resetUserOnExpiry(supabase: any, userId: string) {
  const { error } = await supabase
    .from("users")
    .update({
      plan: "expired",
      credits: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Failed to reset user to free:", error);
  }

  await supabase
    .from("subscriptions")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  console.log(`User ${userId} reset to expired`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("creem-signature");

    const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;
    if (
      webhookSecret &&
      webhookSecret !== "your-webhook-secret-here" &&
      signature
    ) {
      // TODO: HMAC-SHA256 signature verification per Creem docs
    } else {
      console.log("[DEV] Skipping webhook signature verification");
    }

    const event = JSON.parse(body);
    console.log("Creem webhook event:", event.type);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    switch (event.type) {
      case "subscription.created": {
        const sub = event.data;
        const metadata = sub.metadata || {};
        const userId = metadata.user_id;
        const planId = metadata.plan_id;

        if (!userId || !planId) {
          console.error("Missing user_id or plan_id in subscription metadata");
          break;
        }

        await addCreditsToUser(
          supabase,
          userId,
          planId,
          sub.id,
          sub.current_period_start,
          sub.current_period_end
        );

        await supabase.from("transactions").insert({
          user_id: userId,
          amount: sub.amount ? sub.amount / 100 : 0,
          credits: PLAN_CREDITS[planId] || 0,
          payment_method: "creem",
          payment_id: sub.id,
          status: "completed",
          completed_at: new Date().toISOString(),
        });

        console.log(`Subscription created: ${planId} for user ${userId}`);
        break;
      }

      case "subscription.renewed":
      case "invoice.paid": {
        const invoice = event.data;
        const metadata = invoice.metadata || {};
        const userId = metadata.user_id;
        const planId = metadata.plan_id;
        const subscriptionId = invoice.subscription_id || invoice.id;

        if (!userId || !planId) {
          console.error("Missing user_id or plan_id in invoice metadata");
          break;
        }

        await addCreditsToUser(
          supabase,
          userId,
          planId,
          subscriptionId,
          invoice.period_start || new Date().toISOString(),
          invoice.period_end || new Date().toISOString()
        );

        console.log(`Subscription renewed: ${planId} for user ${userId}`);
        break;
      }

      case "subscription.canceled": {
        const sub = event.data;
        const metadata = sub.metadata || {};
        const userId = metadata.user_id;

        if (!userId) {
          console.error("Missing user_id in subscription metadata");
          break;
        }

        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        console.log(`Subscription canceled for user ${userId}`);
        break;
      }

      case "subscription.expired": {
        const sub = event.data;
        const metadata = sub.metadata || {};
        const userId = metadata.user_id;

        if (!userId) {
          const { data: subRecord } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("creem_subscription_id", sub.id)
            .single();

          if (subRecord) {
            await resetUserOnExpiry(supabase, subRecord.user_id);
          }
        } else {
          await resetUserOnExpiry(supabase, userId);
        }

        console.log(`Subscription expired for user ${userId || "unknown"}`);
        break;
      }

      case "payment.completed": {
        const payment = event.data;
        const { user_id, plan_id, credits } = payment.metadata || {};

        if (!user_id || !credits) {
          console.error("Missing metadata in payment event");
          break;
        }

        await supabase.from("transactions").insert({
          user_id,
          amount: payment.amount / 100,
          credits: parseInt(credits),
          payment_method: "creem",
          payment_id: payment.id,
          status: "completed",
          completed_at: new Date().toISOString(),
        });

        const { data: user } = await supabase
          .from("users")
          .select("credits")
          .eq("id", user_id)
          .single();

        if (user) {
          await supabase
            .from("users")
            .update({
              credits: user.credits + parseInt(credits),
              plan: plan_id || "starter",
              updated_at: new Date().toISOString(),
            })
            .eq("id", user_id);
        }

        console.log(`Payment completed: ${credits} credits for user ${user_id}`);
        break;
      }

      case "payment.failed": {
        const payment = event.data;
        const { user_id } = payment.metadata || {};

        if (user_id) {
          await supabase.from("transactions").insert({
            user_id,
            amount: payment.amount / 100,
            credits: 0,
            payment_method: "creem",
            payment_id: payment.id,
            status: "failed",
          });
        }

        console.log(`Payment failed for user ${user_id}`);
        break;
      }

      case "refund.created": {
        const refund = event.data;
        const { user_id, credits } = refund.metadata || {};

        if (user_id && credits) {
          await supabase.from("transactions").insert({
            user_id,
            amount: -(refund.amount / 100),
            credits: -parseInt(credits),
            payment_method: "creem",
            payment_id: refund.id,
            status: "refunded",
          });

          const { data: user } = await supabase
            .from("users")
            .select("credits")
            .eq("id", user_id)
            .single();

          if (user) {
            await supabase
              .from("users")
              .update({
                credits: Math.max(0, user.credits - parseInt(credits)),
                updated_at: new Date().toISOString(),
              })
              .eq("id", user_id);
          }
        }

        console.log(`Refund processed for user ${user_id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
