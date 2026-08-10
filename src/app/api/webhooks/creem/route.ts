import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const PLAN_CREDITS: Record<string, number> = {
  starter: 10,
  pro: 30,
};

// Verify Creem webhook HMAC-SHA256 signature
function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const digest = hmac.digest('hex');
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

async function addCreditsToUser(
  supabase: any,
  userId: string,
  planId: string,
  subscriptionId: string,
  periodEnd: string
) {
  const credits = PLAN_CREDITS[planId] || 0;

  await supabase.from('users').update({
    plan: planId,
    credits: credits,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    plan_id: planId,
    creem_subscription_id: subscriptionId,
    status: 'active',
    credits_per_month: credits,
    current_period_end: periodEnd,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  console.log(`Credits set: ${credits} for user ${userId} (plan: ${planId})`);
}

async function resetUserOnExpiry(supabase: any, userId: string) {
  await supabase.from('users').update({
    plan: 'expired',
    credits: 0,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);

  await supabase.from('subscriptions').update({
    status: 'expired',
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId);

  console.log(`User ${userId} reset to expired`);
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('creem-signature');

    // Verify webhook signature
    const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;
    if (webhookSecret && webhookSecret !== 'your-webhook-secret-here') {
      if (!verifySignature(payload, signature, webhookSecret)) {
        console.error('[Creem Webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.log('[Creem Webhook] DEV mode - signature verification skipped');
    }

    const event = JSON.parse(payload);
    console.log('[Creem Webhook] Event:', event.type);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const data = event.data || {};

    switch (event.type) {

      // --- Checkout Events ---
      case 'checkout.completed': {
        // Find pending checkout to get user_id
        const checkoutId = data.id;
        if (checkoutId) {
          const { data: pending } = await supabase
            .from('pending_checkouts')
            .select('user_id, plan_id, credits')
            .eq('checkout_id', checkoutId)
            .single();

          if (pending) {
            await supabase.from('transactions').insert({
              user_id: pending.user_id,
              amount: 0, // Amount handled by Creem
              credits: pending.credits,
              payment_method: 'creem',
              payment_id: checkoutId,
              status: 'completed',
              completed_at: new Date().toISOString(),
            });
            // Clean up pending record
            await supabase.from('pending_checkouts').delete().eq('checkout_id', checkoutId);
          }
        }
        console.log(`Checkout completed: ${checkoutId}`);
        break;
      }

      // --- Subscription Events ---
      case 'subscription.active': {
        // Docs: "for sync only, use subscription.paid to grant access"
        // Just log; actual access granting happens on subscription.paid
        console.log(`Subscription active (sync): ${data.id}`);
        break;
      }

      case 'subscription.paid': {
        // Docs: RECOMMENDED event for granting access
        const subId = data.id;
        const productId = data.product_id;
        const planId = Object.entries(PLAN_CREDITS).find(
          ([, v]) => v === PLAN_CREDITS[productId]
        )?.[0] || 'starter';

        // Find user from pending_checkouts or subscriptions table
        let userId: string | null = null;

        // Try to find by subscription ID in our subscriptions table
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('creem_subscription_id', subId)
          .single();

        if (existingSub) {
          userId = existingSub.user_id;
        }

        if (userId) {
          await addCreditsToUser(
            supabase, userId, planId, subId,
            data.current_period_end || new Date().toISOString()
          );

          await supabase.from('transactions').insert({
            user_id: userId,
            amount: data.amount ? data.amount / 100 : 0,
            credits: PLAN_CREDITS[planId] || 0,
            payment_method: 'creem',
            payment_id: subId,
            status: 'completed',
            completed_at: new Date().toISOString(),
          });
        }

        console.log(`Subscription paid: ${subId} for user ${userId}`);
        break;
      }

      case 'subscription.canceled': {
        const subId = data.id;
        await supabase.from('subscriptions').update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        }).eq('creem_subscription_id', subId);
        console.log(`Subscription canceled: ${subId}`);
        break;
      }

      case 'subscription.scheduled_cancel': {
        const subId = data.id;
        await supabase.from('subscriptions').update({
          status: 'scheduled_cancel',
          updated_at: new Date().toISOString(),
        }).eq('creem_subscription_id', subId);
        console.log(`Subscription scheduled cancel: ${subId}`);
        break;
      }

      case 'subscription.past_due': {
        const subId = data.id;
        await supabase.from('subscriptions').update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        }).eq('creem_subscription_id', subId);
        console.log(`Subscription past due: ${subId}`);
        break;
      }

      case 'subscription.expired': {
        // Docs: NOT a terminal state, may still retry
        const subId = data.id;
        const { data: subRecord } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('creem_subscription_id', subId)
          .single();

        if (subRecord) {
          await resetUserOnExpiry(supabase, subRecord.user_id);
        }
        console.log(`Subscription expired: ${subId}`);
        break;
      }

      case 'subscription.trialing':
      case 'subscription.paused':
      case 'subscription.update': {
        console.log(`Subscription event: ${event.type} for ${data.id}`);
        break;
      }

      // --- Refund & Dispute ---
      case 'refund.created': {
        const refundId = data.id;
        const { data: tx } = await supabase
          .from('transactions')
          .select('user_id, credits')
          .eq('payment_id', data.payment_id || data.subscription_id)
          .single();

        if (tx) {
          await supabase.from('transactions').insert({
            user_id: tx.user_id,
            amount: -(data.amount ? data.amount / 100 : 0),
            credits: -tx.credits,
            payment_method: 'creem',
            payment_id: refundId,
            status: 'refunded',
          });

          const { data: user } = await supabase
            .from('users')
            .select('credits')
            .eq('id', tx.user_id)
            .single();

          if (user) {
            await supabase.from('users').update({
              credits: Math.max(0, user.credits - tx.credits),
              updated_at: new Date().toISOString(),
            }).eq('id', tx.user_id);
          }
        }
        console.log(`Refund created: ${refundId}`);
        break;
      }

      case 'dispute.created': {
        console.log(`Dispute created: ${data.id}`);
        break;
      }

      default:
        console.log(`Unhandled Creem event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Creem Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
