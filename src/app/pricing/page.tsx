'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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

      if (data.error) {
        throw new Error(data.error)
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
                    onClick={() => handlePurchase(plan)}
                    disabled={loadingPlan !== null || !plan.available}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : plan.available ? (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Get {plan.credits} Credits
                      </>
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
    </>
  )
}
