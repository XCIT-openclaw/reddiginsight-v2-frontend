-- V6: Add pending_checkouts table for Creem checkout flow
CREATE TABLE IF NOT EXISTS public.pending_checkouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checkout_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pending_checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.pending_checkouts
  FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS idx_pending_checkouts_checkout_id ON public.pending_checkouts(checkout_id);
