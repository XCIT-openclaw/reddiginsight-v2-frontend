import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PLAN_CREDITS: Record<string, number> = {
  starter: 10,
  pro: 30,
};

const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_22VvlqddlgnK8O0hHY6kLU": "starter",
  "prod_7ArQ4AAhRf4LVsIGiE8IgJ": "pro",
};

/**
 * Verify and process Creem checkout completion from redirect URL params.
 * This is a fallback for when webhooks are delayed or unreachable (e.g. local dev).
 * Deduplication: checks transactions table for existing payment_id before adding credits.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { checkout_id, order_id, plan_id, product_id, subscription_id } = body;

    if (!checkout_id && !order_id) {
      return NextResponse.json({ error: "checkout_id or order_id is required" }, { status: 400 });
    }

    const paymentId = order_id || checkout_id;
    const planId = plan_id || PRODUCT_TO_PLAN[product_id] || "starter";
    const credits = PLAN_CREDITS[planId] || 10;
    const isSubscription = Boolean(PRODUCT_TO_PLAN[product_id]);

    console.log("[verify-checkout] Processing:", { checkout_id, order_id, planId, credits, isSubscription, userId: user.id });

    if (isSubscription) {
      // Recurring subscription credits are granted by the Creem subscription.paid webhook.
      // Processing them here too would duplicate the same purchase.
      const subscriptionPaymentId = subscription_id || order_id || checkout_id;
      const { data: existingTx } = await supabase
        .from("transactions")
        .select("id, credits")
        .eq("payment_id", subscriptionPaymentId)
        .maybeSingle();

      if (existingTx) {
        console.log("[verify-checkout] Already processed:", subscriptionPaymentId);
        return NextResponse.json({
          success: true,
          message: "Already processed",
          alreadyProcessed: true,
          credits: existingTx.credits,
          debug: { checkout_id, order_id, subscription_id, paymentId: subscriptionPaymentId, planId, existingCredits: existingTx.credits },
        });
      }

      const { data: activeSubscription } = await supabase
        .from("subscriptions")
        .select("id, status, plan_id, creem_subscription_id, current_period_start")
        .eq("user_id", user.id)
        .maybeSingle();

      const subscriptionMatchesRedirect =
        activeSubscription?.status === "active" &&
        activeSubscription?.plan_id === planId &&
        (!subscription_id || activeSubscription?.creem_subscription_id === subscription_id);

      if (subscriptionMatchesRedirect) {
        let completedTransactionQuery = supabase
          .from("transactions")
          .select("id, credits")
          .eq("user_id", user.id)
          .eq("credits", credits)
          .eq("payment_method", "creem")
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(1);

        const transactionFloor = activeSubscription?.current_period_start || null;
        if (transactionFloor) {
          completedTransactionQuery = completedTransactionQuery.gte("created_at", transactionFloor);
        }

        const { data: completedTransaction } = await completedTransactionQuery.maybeSingle();
        if (completedTransaction) {
          console.log("[verify-checkout] Subscription payment already credited:", subscriptionPaymentId);
          return NextResponse.json({
            success: true,
            message: "Already processed",
            alreadyProcessed: true,
            credits: completedTransaction.credits,
            debug: {
              checkout_id,
              order_id,
              subscription_id,
              paymentId: subscriptionPaymentId,
              transactionId: completedTransaction.id,
              planId,
              existingCredits: completedTransaction.credits,
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        pending: true,
        message: "Payment received. Your credits are being finalized.",
        debug: { checkout_id, order_id, subscription_id, paymentId: subscriptionPaymentId, planId, credits, userId: user.id },
      });
    }

    // Dedup check
    const { data: existingTx } = await supabase
      .from("transactions")
      .select("id, credits")
      .eq("payment_id", paymentId)
      .maybeSingle();

    if (existingTx) {
      console.log("[verify-checkout] Already processed:", paymentId);
      return NextResponse.json({
        success: true,
        message: "Already processed",
        alreadyProcessed: true,
        credits: existingTx.credits,
        debug: {
          checkout_id,
          order_id,
          paymentId,
          planId,
          existingCredits: existingTx.credits,
        },
      });
    }

    // Insert transaction
    await supabase.from("transactions").insert({
      user_id: user.id,
      amount: 0,
      credits: credits,
      payment_method: "creem",
      payment_id: paymentId,
      status: "completed",
      completed_at: new Date().toISOString(),
    });

    // Add credits to user
    const { data: userData } = await supabase.from("users").select("credits").eq("id", user.id).single();
    const currentCredits = userData?.credits || 0;
    const newCredits = currentCredits + credits;

    await supabase.from("users").update({
      credits: newCredits,
      plan: planId,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);

    console.log("[verify-checkout] Credits added:", credits, "New total:", newCredits);

    return NextResponse.json({
      success: true,
      message: "Credits added successfully",
      creditsAdded: credits,
      totalCredits: newCredits,
      debug: {
        checkout_id,
        order_id,
        paymentId,
        planId,
        credits,
        currentCredits,
        newCredits,
        userId: user.id,
      },
    });
  } catch (error) {
    console.error("[verify-checkout] Error:", error);
    return NextResponse.json({
      error: "Failed to verify checkout",
      details: error instanceof Error ? error.message : String(error),
      debug: {
        error: error instanceof Error ? error.message : String(error),
      },
    }, { status: 500 });
  }
}