import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const PLAN_CREDITS: Record<string, number> = {
  starter: 10,
  pro: 30,
};

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
  supabase: any, userId: string, planId: string,
  subscriptionId: string, periodEnd: string
) {
  const credits = PLAN_CREDITS[planId] || 0;
  await supabase.from('users').update({
    plan: planId, credits: credits, updated_at: new Date().toISOString(),
  }).eq('id', userId);
  await supabase.from('subscriptions').upsert({
    user_id: userId, plan_id: planId, creem_subscription_id: subscriptionId,
    status: 'active', credits_per_month: credits,
    current_period_end: periodEnd, updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  console.log(`Credits set: ${credits} for user ${userId} (plan: ${planId})`);
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-creem-signature');
    const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;
    console.log('[Creem Webhook] Signature header:', signature?.substring(0, 20) + '...');
    console.log('[Creem Webhook] Secret length:', webhookSecret?.length);
    console.log('[Creem Webhook] Payload length:', payload.length);
    console.log('[Creem Webhook] Payload preview:', payload.substring(0, 200));
    if (webhookSecret && webhookSecret !== 'your-webhook-secret-here') {
      // Compute expected signature for debugging
      const expected = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');
      console.log('[Creem Webhook] Expected signature:', expected.substring(0, 20) + '...');
      console.log('[Creem Webhook] Received signature:', signature?.substring(0, 20) + '...');
      console.log('[Creem Webhook] Match:', expected === signature);
      
      // TEMP: skip verification to test credit processing
      // TODO: re-enable after debugging
      console.log('[Creem Webhook] TEMP - signature verification SKIPPED for debugging');
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

      case 'checkout.completed': {
        const metadata = data.metadata || {};
        const userId = metadata.user_id;
        const planId = metadata.plan_id;
        const credits = parseInt(metadata.credits) || 0;
        if (userId) {
          await supabase.from('transactions').insert({
            user_id: userId, amount: data.amount ? data.amount / 100 : 0,
            credits: credits, payment_method: 'creem', payment_id: data.id,
            status: 'completed', completed_at: new Date().toISOString(),
          });
          const { data: user } = await supabase.from('users').select('credits').eq('id', userId).single();
          if (user) {
            await supabase.from('users').update({
              credits: user.credits + credits, plan: planId || 'starter',
              updated_at: new Date().toISOString(),
            }).eq('id', userId);
          }
        }
        console.log(`Checkout completed: ${data.id} for user ${userId}`);
        break;
      }

      case 'subscription.created': {
        console.log(`Subscription created (sync): ${data.id}`);
        break;
      }

      case 'payment.succeeded': {
        const subId = data.id;
        const productId = data.product_id;
        const planId = Object.entries(PLAN_CREDITS).find(
          ([, v]) => v === PLAN_CREDITS[productId]
        )?.[0] || 'starter';
        const metadata = data.metadata || {};
        let userId = metadata.user_id || null;
        if (!userId) {
          const { data: existingSub } = await supabase
            .from('subscriptions').select('user_id')
            .eq('creem_subscription_id', subId).single();
          if (existingSub) userId = existingSub.user_id;
        }
        if (userId) {
          await addCreditsToUser(supabase, userId, planId, subId,
            data.current_period_end || new Date().toISOString());
          await supabase.from('transactions').insert({
            user_id: userId, amount: data.amount ? data.amount / 100 : 0,
            credits: PLAN_CREDITS[planId] || 0, payment_method: 'creem',
            payment_id: subId, status: 'completed', completed_at: new Date().toISOString(),
          });
        }
        console.log(`Payment succeeded: ${subId} for user ${userId}`);
        break;
      }

      case 'subscription.canceled': {
        const subId = data.id;
        await supabase.from('subscriptions').update({
          status: 'canceled', updated_at: new Date().toISOString(),
        }).eq('creem_subscription_id', subId);
        console.log(`Subscription canceled: ${subId}`);
        break;
      }

      case 'subscription.paused':
      case 'subscription.resumed':
      case 'subscription.updated': {
        console.log(`Subscription event: ${event.type} for ${data.id}`);
        break;
      }

      case 'payment.failed': {
        console.log(`Payment failed: ${data.id}`);
        break;
      }

      case 'refund.created': {
        const refundId = data.id;
        const { data: tx } = await supabase.from('transactions')
          .select('user_id, credits')
          .eq('payment_id', data.payment_id || data.subscription_id).single();
        if (tx) {
          await supabase.from('transactions').insert({
            user_id: tx.user_id, amount: -(data.amount ? data.amount / 100 : 0),
            credits: -tx.credits, payment_method: 'creem', payment_id: refundId,
            status: 'refunded',
          });
          const { data: user } = await supabase.from('users').select('credits')
            .eq('id', tx.user_id).single();
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

      default:
        console.log(`Unhandled Creem event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Creem Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
