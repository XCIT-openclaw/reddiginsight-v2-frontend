-- V9: Allow NULL credits_per_month for terminal subscriptions.
-- NULL means the subscription has no active paid plan; 0 remains valid historically.
ALTER TABLE public.subscriptions
  ALTER COLUMN credits_per_month DROP NOT NULL;
