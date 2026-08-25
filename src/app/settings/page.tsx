'use client'

import { useEffect, useState } from 'react'
import { PLAN_CHANGE_FEATURE_ENABLED } from '@/lib/subscription-state'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { DashboardNav } from '@/components/DashboardNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { User, CreditCard, Bell, Shield, Loader2, CalendarClock } from 'lucide-react'
import { toast } from 'sonner'

interface SubscriptionStatus {
  plan_id: string | null
  status: string | null
  pending_plan: string | null
  plan_change_requested_at: string | null
  credits_per_month: number | null
  current_period_end: string | null
}

function formatPlan(planId: string | null): string {
  if (planId === 'pro') return 'Pro'
  if (planId === 'starter') return 'Starter'
  return 'Free'
}

function formatSubscriptionStatus(status: string | null): string {
  switch (status) {
    case 'active': return 'Active'
    case 'trialing': return 'Trialing'
    case 'past_due': return 'Past Due'
    case 'paused': return 'Paused'
    case 'scheduled_cancel': return 'Cancellation Scheduled'
    case 'canceled': return 'Canceled'
    case 'expired': return 'Expired'
    case 'unpaid': return 'Unpaid'
    default: return status || 'Inactive'
  }
}

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [resumeLoading, setResumeLoading] = useState(false)

  const hasSubscriptionCard = Boolean(subscriptionStatus && !['canceled', 'expired'].includes(subscriptionStatus.status || ''))
  const isCancellationScheduled = subscriptionStatus?.status === 'scheduled_cancel'

  const loadSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscriptions/status')
      if (!response.ok) return
      const data = await response.json()
      if (data?.subscription) {
        setSubscriptionStatus(data.subscription)
      }
    } catch {
      // Ignore subscription status fetch errors on the settings page.
    }
  }

  useEffect(() => {
    loadSubscriptionStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handlePurchaseCredits = () => {
    router.push('/pricing')
  }

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in both password fields')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setPasswordLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Password changed successfully')
      setChangingPassword(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    setCancelLoading(true)
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'scheduled' }),
      })

      const data = await response.json()
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      setSubscriptionStatus((previous) => ({
        ...(previous || {
          plan_id: profile?.plan || 'free',
          pending_plan: null,
          plan_change_requested_at: null,
          credits_per_month: null,
          current_period_end: null,
        }),
        status: 'scheduled_cancel',
      }))
      setCancelDialogOpen(false)
      toast.success('Subscription cancellation scheduled', {
        description: 'Your subscription will remain active until the end of the current billing cycle.',
        duration: 7000,
      })
      setTimeout(() => { loadSubscriptionStatus() }, 1500)
    } catch (error: any) {
      toast.error('Failed to cancel subscription', {
        description: error?.message || 'Please try again.',
      })
    } finally {
      setCancelLoading(false)
    }
  }

  const handleReactivateSubscription = async () => {
    setResumeLoading(true)
    try {
      const response = await fetch('/api/subscriptions/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to reactivate subscription')
      }

      setSubscriptionStatus((previous) => ({
        ...(previous || {
          plan_id: profile?.plan || 'free',
          pending_plan: null,
          plan_change_requested_at: null,
          credits_per_month: null,
          current_period_end: null,
        }),
        status: 'active',
      }))
      toast.success('Subscription reactivated', {
        description: 'Your subscription will renew as scheduled.',
        duration: 7000,
      })
      setTimeout(() => { loadSubscriptionStatus() }, 1500)
    } catch (error: any) {
      toast.error('Failed to reactivate subscription', {
        description: error?.message || 'Please try again.',
      })
    } finally {
      setResumeLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20">
      <DashboardNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Account ID</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {user?.id?.slice(0, 8)}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credits Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>Credits</CardTitle>
            </div>
            <CardDescription>Your credit balance and usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Available Credits</p>
                <p className="text-sm text-muted-foreground">
                  Each credit allows one subreddit analysis
                </p>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-1">
                {profile?.credits ?? 0}
              </Badge>
            </div>
            <Separator />
            <Button variant="outline" className="w-full" onClick={handlePurchaseCredits}>
              Purchase More Credits
            </Button>
          </CardContent>
        </Card>

        {/* Subscription Section */}
        {hasSubscriptionCard && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                <CardTitle>Subscription</CardTitle>
              </div>
              <CardDescription>Manage your subscription plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Current Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPlan(subscriptionStatus?.plan_id || profile?.plan || null)}
                  </p>
                </div>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {formatSubscriptionStatus(subscriptionStatus?.status || null)}
                </Badge>
              </div>

              {subscriptionStatus?.current_period_end && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Current Period Ends</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(subscriptionStatus.current_period_end).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Temporary production guard: hide scheduled plan-change messaging while
                  upgrade/downgrade is disabled. Keep the block for a one-switch restoration. */}
              {PLAN_CHANGE_FEATURE_ENABLED && subscriptionStatus?.pending_plan && (
                <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-sm text-amber-700">
                  Your next plan is {formatPlan(subscriptionStatus.pending_plan)}. It will start at the beginning of your next billing cycle.
                </div>
              )}

              {isCancellationScheduled && (
                <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-sm text-amber-700">
                  Cancellation is scheduled for the end of the current billing cycle. You can reactivate your subscription before that date.
                </div>
              )}

              <Separator />
              {isCancellationScheduled && (
                <Button
                  className="w-full"
                  onClick={handleReactivateSubscription}
                  disabled={resumeLoading}
                >
                  {resumeLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Reactivate Subscription
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setCancelDialogOpen(true)}
                disabled={isCancellationScheduled}
              >
                {isCancellationScheduled ? 'Cancellation Scheduled' : 'Cancel Subscription'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Cancellation takes effect at the end of the current billing cycle.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Configure how you receive updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive emails when reports are completed
                </p>
              </div>
              <Button variant="outline" size="sm" disabled className="opacity-50 cursor-not-allowed">
                Enable
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!changingPassword ? (
              <Button variant="outline" className="w-full" onClick={() => setChangingPassword(true)}>
                Change Password
              </Button>
            ) : (
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleChangePassword} disabled={passwordLoading}>
                    {passwordLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Save Password
                  </Button>
                  <Button variant="ghost" onClick={() => { setChangingPassword(false); setNewPassword(''); setConfirmPassword('') }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            <Separator />
            <div className="pt-2">
              <Button variant="destructive" className="w-full" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={cancelDialogOpen} onOpenChange={(open) => !cancelLoading && setCancelDialogOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel subscription?</DialogTitle>
            <DialogDescription>
              Your subscription will remain active until the end of the current billing cycle. After that, it will not renew and your plan will return to Free.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={cancelLoading}>
              Keep Subscription
            </Button>
            <Button variant="destructive" onClick={handleCancelSubscription} disabled={cancelLoading}>
              {cancelLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
