import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PLAN_PRODUCTS: Record<string, { productId: string; credits: number; name: string }> = {
  starter: {
    productId: 'prod_22VvlqddlgnK8O0hHY6kLU',
    credits: 10,
    name: 'Starter Plan',
  },
  pro: {
    productId: 'prod_7ArQ4AAhRf4LVsIGiE8IgJ',
    credits: 30,
    name: 'Pro Plan',
  },
};

function getCreemApiBase(): string {
  return process.env.CREEM_API_URL || 'https://test-api.creem.io/v1';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const plan = PLAN_PRODUCTS[body.planId];
    if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

    const creemApiKey = process.env.CREEM_API_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!creemApiKey || creemApiKey === 'your-creem-api-key-here') {
      console.log('[DEV] Simulating Creem checkout:', plan.name);
      return NextResponse.json({ success: true, message: 'Subscription simulated (dev mode)', credits: plan.credits });
    }

    const apiBase = getCreemApiBase();
    console.log('[Creem] Checkout URL:', apiBase + '/checkouts');

    const creemResponse = await fetch(apiBase + '/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': creemApiKey,
      },
      body: JSON.stringify({
        product_id: plan.productId,
        success_url: appUrl + '/dashboard?subscription=success',
        // cancel_url not supported by test-api, uncomment for production
        // cancel_url: appUrl + '/pricing?subscription=canceled',
        metadata: {
          user_id: user.id,
          plan_id: body.planId,
          credits: String(plan.credits),
        },
      }),
    });

    if (!creemResponse.ok) {
      const errorText = await creemResponse.text();
      console.error('[Creem] Checkout error:', creemResponse.status, errorText);
      return NextResponse.json(
        { error: 'Payment service error: ' + creemResponse.status, detail: errorText.slice(0, 300) },
        { status: 502 }
      );
    }

    const session = await creemResponse.json();
    console.log('[Creem] Checkout created:', session.id);

    return NextResponse.json({ checkoutUrl: session.url || session.checkout_url, sessionId: session.id });
  } catch (error) {
    console.error('[Creem] Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
