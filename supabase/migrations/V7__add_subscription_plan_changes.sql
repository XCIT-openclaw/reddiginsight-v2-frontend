-- V7: Add subscription plan-change state (one change per billing cycle)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS pending_plan TEXT,
  ADD COLUMN IF NOT EXISTS plan_change_requested_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_change_requested_at
  ON public.subscriptions(plan_change_requested_at);
-- Expand subscription lifecycle status values to match Creem webhook events
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'trialing', 'canceled', 'expired', 'past_due', 'paused', 'scheduled_cancel', 'unpaid'));
