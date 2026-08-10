import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CheckoutRequest {
  planId: string
  productId: string
  credits: number
  amount: number
}

const SUBSCRIPTION_PLANS: Record<string, { productId: string; credits: number; name: string }> = {
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
}

function getCreemApiUrl(apiKey: string): string {
  const base = process.env.CREEM_API_URL || (apiKey.startsWith('creem_test_') ? 'https://test-api.creem.io/v1' : 'https://api.creem.io/v1');
  return base + '/checkouts';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: CheckoutRequest = await request.json()
    const plan = SUBSCRIPTION_PLANS[body.planId]
    if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const creemApiKey = process.env.CREEM_API_KEY
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Dev mode: simulate subscription
    if (!creemApiKey || creemApiKey === 'your-creem-api-key-here') {
      console.log('[DEV] Simulating Creem subscription:', plan.name)
      return NextResponse.json({ success: true, message: 'Subscription simulated (dev mode)', credits: plan.credits })
    }

    const apiUrl = getCreemApiUrl(creemApiKey)
    console.log('[Creem] Using API URL:', apiUrl)

    // Production: Create subscription checkout
    const creemResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + creemApiKey },
      body: JSON.stringify({
        mode: 'subscription',
        line_items: [{ product_id: plan.productId, quantity: 1 }],
        success_url: appUrl + '/dashboard?subscription=success',
        cancel_url: appUrl + '/pricing?subscription=canceled',
        metadata: { user_id: user.id, plan_id: body.planId, credits: plan.credits },
      }),
    })

    if (!creemResponse.ok) {
      const errorText = await creemResponse.text()
      console.error('Creem API error:', creemResponse.status, errorText)
      return NextResponse.json({ error: 'Payment service error: ' + creemResponse.status, detail: errorText.slice(0, 200) }, { status: 502 })
    }

    const session = await creemResponse.json()
    return NextResponse.json({ checkoutUrl: session.url, sessionId: session.id })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
