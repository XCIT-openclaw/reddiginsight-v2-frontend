'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Check, Zap, CreditCard, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardNav } from '@/components/DashboardNav'

interface PricingPlan {
  id: string
  productId?: string
  name: string
  credits?: number
  price: number | string
  pricePerCredit?: string
  popular?: boolean
  available: boolean
  features: string[]
}

interface SubscriptionStatus {
  plan_id: string | null
  status: string | null
  pending_plan: string | null
  plan_change_requested_at: string | null
  credits_per_month: number | null
  current_period_end: string | null
}

const plans: PricingPlan[] = [
  {
    id: 'starter',
    productId: 'prod_22VvlqddlgnK8O0hHY6kLU',
    name: 'Starter',
    credits: 10,
    price: 9.9,
    popular: true,
    available: true,
    features: [
      '10 powerful analysis reports',
      'AI-powered insights',
      'Sentiment analysis',
      'Export to HTML',
      'Email support',
    ],
  },
  {
    id: 'pro',
    productId: 'prod_7ArQ4AAhRf4LVsIGiE8IgJ',
    name: 'Pro',
    credits: 30,
    price: 29.9,
    popular: false,
    available: true,
    features: [
      '30 powerful analysis reports',
      'AI-powered insights',
      'Sentiment analysis',
      'Export to HTML',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Coming Soon',
    available: false,
    features: [
      'Custom solutions',
      'Dedicated support',
      'API access',
    ],
  },
]

export default function PricingPage() {
  const { user, profile, refreshProfile } = useAuth()
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [pendingPlanChange, setPendingPlanChange] = useState<PricingPlan | null>(null)
  const subscriptionCurrentPlan =
    subscriptionStatus?.plan_id &&
    !['canceled', 'expired'].includes(subscriptionStatus.status || '')
      ? subscriptionStatus.plan_id
      : null
  const currentPlan = subscriptionCurrentPlan || profile?.plan || 'free'
  const hasPlanChangeRequested = Boolean(subscriptionStatus?.plan_change_requested_at)
  const pendingPlan = subscriptionStatus?.pending_plan || null
  const isCancellationScheduled = subscriptionStatus?.status === 'scheduled_cancel'

  useEffect(() => {
    if (!user) return
    let active = true
    fetch('/api/subscriptions/status')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active && data?.subscription) {
          setSubscriptionStatus(data.subscription)
        }
      })
      .catch(() => {})
    return () => { active = false }
  }, [user])

  const handlePurchase = async (plan: PricingPlan) => {
    if (!plan.available) return
    
    if (!user) {
      router.push('/login?redirect=/pricing')
      return
    }

    setLoadingPlan(plan.id)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          productId: plan.productId,
          credits: plan.credits,
          amount: plan.price,
        }),
      })

      const data = await response.json()
      console.log('[Checkout] Full response:', data)
      console.log('[Checkout] Debug:', data.debug)

      if (data.error) {
        console.error('[Checkout] Error response:', data)
        throw new Error(data.error + (data.detail ? ' | ' + data.detail : ''))
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        toast.success('Payment successful!', {
          description: `${plan.credits} credits have been added to your account.`,
        })
        await refreshProfile()
      }
    } catch (error) {
      toast.error('Payment failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setLoadingPlan(null)
    }
  }

  const handlePlanChange = (plan: PricingPlan) => {
    if (!plan.available || !plan.productId || !user) return

    if (isCancellationScheduled) {
      toast.error('Subscription cancellation scheduled', {
        description: 'Reactivate your subscription from Settings before changing plans.',
      })
      return
    }

    const isUpgrade = plan.id === 'pro' && currentPlan === 'starter'
    const isDowngrade = plan.id === 'starter' && currentPlan === 'pro'
    if (!isUpgrade && !isDowngrade) return

    if (hasPlanChangeRequested) {
      toast.error('Plan change already requested', {
        description: 'You can only change your subscription plan once per billing cycle.',
      })
      return
    }

    setPendingPlanChange(plan)
  }

  const executePlanChange = async (plan: PricingPlan) => {
    const isUpgrade = plan.id === 'pro' && currentPlan === 'starter'
    const isDowngrade = plan.id === 'starter' && currentPlan === 'pro'
    setLoadingPlan(plan.id)

    try {
      const response = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: plan.productId,
          update_behavior: 'proration-none',
        }),
      })

      const data = await response.json()
      if (data.error) {
        throw new Error(data.error + (data.details ? ' | ' + data.details : ''))
      }

      if (isUpgrade) {
        toast.success('Upgrade scheduled', {
          description: 'Your Starter plan and current credits remain active for this billing cycle. Pro starts next cycle at $29.90/month with 30 credits.',
          duration: 7000,
        })
      } else {
        toast.success('Downgrade scheduled', {
          description: 'Your current 30 credits remain available until the end of this billing cycle. Starting next cycle, you will be billed $9.90/month and receive 10 credits.',
          duration: 7000,
        })
      }

      setSubscriptionStatus((previous) => ({
        ...(previous || {
          plan_id: currentPlan,
          status: 'active',
          credits_per_month: null,
          current_period_end: null,
        }),
        pending_plan: plan.id,
        plan_change_requested_at: new Date().toISOString(),
      }))

      setPendingPlanChange(null)
      setTimeout(() => { refreshProfile() }, 3500)
    } catch (error) {
      toast.error('Plan change failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setLoadingPlan(null)
    }
  }

  const upgradePeriodEnd = subscriptionStatus?.current_period_end ? new Date(subscriptionStatus.current_period_end) : null
  const upgradeDaysRemaining = upgradePeriodEnd
    ? Math.max(0, Math.ceil((upgradePeriodEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null
  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Simple, Transparent Pricing
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose a plan that fits your needs. Each credit lets you generate one analysis report in one subreddit.
            </p>
          </div>

          {/* Current Credits */}
          {user && (
            <div className="text-center mb-8">
              <Badge variant="secondary" className="text-base px-4 py-2">
                <Zap className="h-4 w-4 mr-2" />
                Current Balance: {profile?.credits ?? 0} credits
              </Badge>
            </div>
          )}

          {user && !isCancellationScheduled && (currentPlan === 'starter' || currentPlan === 'pro') && (
            <div className="max-w-3xl mx-auto mb-8 px-4 py-3 rounded-lg border bg-muted/30 text-sm text-muted-foreground text-center">
              Plan changes take effect at the start of your next billing cycle. Your current plan and credits remain available until the end of this cycle. The new plan&apos;s price and monthly credits begin next cycle.
            </div>
          )}

          {user && isCancellationScheduled && (
            <div className="max-w-3xl mx-auto mb-8 px-4 py-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-sm text-amber-700 text-center">
              Your subscription is scheduled to cancel at the end of the current billing cycle. Go to{' '}
              <button
                type="button"
                className="underline font-medium text-amber-800 dark:text-amber-300"
                onClick={() => router.push('/settings')}
              >
                Settings
              </button>{' '}
              to reactivate it if you want to keep your plan.
            </div>
          )}

          {user && hasPlanChangeRequested && (
            <div className="max-w-3xl mx-auto mb-8 px-4 py-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-sm text-amber-700 text-center">
              {pendingPlan === 'starter'
                ? 'Your downgrade to Starter is scheduled for the next billing cycle. You can change plans again at the start of that cycle.'
                : pendingPlan === 'pro'
                  ? 'Your upgrade to Pro is scheduled for the next billing cycle. Your current Starter plan and credits remain active until then.'
                  : 'You have already changed your plan this billing cycle. You can change plans again at the start of the next billing cycle.'}
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative flex flex-col overflow-visible ${
                  plan.popular ? 'border-primary shadow-lg scale-105' : ''
                } ${!plan.available ? 'opacity-80' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-primary text-primary-foreground whitespace-nowrap">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    {typeof plan.price === 'number' ? (
                      <>
                        <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                        <span className="text-foreground ml-1">/mo</span>
                      </>
                    ) : (
                      <span className="text-2xl font-semibold text-muted-foreground">{plan.price}</span>
                    )}
                  </CardDescription>
                  {plan.credits && (
                    <div className="text-sm text-muted-foreground">
                      {plan.credits} credits per month
                    </div>
                  )}
                  {user && plan.id === 'pro' && currentPlan === 'starter' && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Schedule an upgrade to keep Starter and your current credits for the rest of this cycle. Pro starts next cycle at $29.90/month with 30 credits.
                    </div>
                  )}
                  {user && plan.id === 'starter' && currentPlan === 'pro' && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Your current 30 credits stay available until this billing cycle ends. Starting next cycle, you will get 10 credits per month.
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => {
                      if (user && plan.id === currentPlan) return
                      if (user && ((plan.id === 'pro' && currentPlan === 'starter') || (plan.id === 'starter' && currentPlan === 'pro'))) {
                        handlePlanChange(plan)
                      } else {
                        handlePurchase(plan)
                      }
                    }}
                    disabled={loadingPlan !== null || !plan.available || (user ? plan.id === currentPlan : false) || Boolean(user && hasPlanChangeRequested && plan.id !== currentPlan) || Boolean(user && isCancellationScheduled && plan.id !== currentPlan)}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : plan.available ? (
                      user && plan.id === currentPlan ? (
                        'Current Plan'
                      ) : user && plan.id === 'pro' && currentPlan === 'starter' ? (
                        'Schedule Upgrade'
                      ) : user && plan.id === 'starter' && currentPlan === 'pro' ? (
                        'Schedule Downgrade'
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Get {plan.credits} Credits
                        </>
                      )
                    ) : (
                      'Coming Soon'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">What is a credit?</h3>
                <p className="text-muted-foreground">
                  One credit allows you to get one analysis report in one subreddit. The analysis includes sentiment analysis,
                  keyword extraction, and AI-powered insights.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Do credits expire?</h3>
                <p className="text-muted-foreground">
                  Credits reset each billing month. Unused credits do not roll over to the next month.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                <p className="text-muted-foreground">
                  We accept all major credit cards through our secure payment provider, Creem.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Is there a refund policy?</h3>
                <p className="text-muted-foreground">
                  If you&apos;re not satisfied with your purchase and have not used any credits, contact us within 7 days for a full refund.
                </p>
              </div>
            </div>
          </div>

          {/* CTA for non-logged users */}
          {!user && (
            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">
                New users get 1 free credit to start!
              </p>
              <Button size="lg" onClick={() => router.push('/signup')}>
                Create Free Account
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={Boolean(pendingPlanChange)} onOpenChange={(open) => !open && !loadingPlan && setPendingPlanChange(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm your plan change</DialogTitle>
            <DialogDescription>
              Your current plan and credits remain active for the rest of this billing cycle. {pendingPlanChange?.id === 'pro' ? 'Pro starts' : 'Starter starts'} at the beginning of your next cycle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-lg border bg-muted/40 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current plan</span>
              <span className="font-medium">{currentPlan === 'pro' ? 'Pro' : 'Starter'} {String.fromCharCode(183)} {currentPlan === 'pro' ? 30 : 10} credits</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">New plan</span>
              <span className="font-medium">{pendingPlanChange?.id === 'pro' ? 'Pro next cycle' : 'Starter next cycle'} {String.fromCharCode(183)} {pendingPlanChange?.id === 'pro' ? 30 : 10} credits/month</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Remaining in cycle</span>
              <span className="font-medium">{upgradeDaysRemaining === null ? 'Current cycle' : upgradeDaysRemaining + (upgradeDaysRemaining === 1 ? ' day' : ' days')}</span>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
              No plan-change charge is made today. Your next regular charge is {pendingPlanChange?.id === 'pro' ? '$29.90 for Pro and includes 30 credits' : '$9.90 for Starter and includes 10 credits'}.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingPlanChange(null)} disabled={loadingPlan !== null}>
              Cancel
            </Button>
            <Button onClick={() => pendingPlanChange && executePlanChange(pendingPlanChange)} disabled={loadingPlan !== null}>
              {loadingPlan ? 'Processing...' : 'Confirm plan change'}
            </Button>
          </DialogFooter>
        </DialogContent>      </Dialog>
    </>
  )
}
