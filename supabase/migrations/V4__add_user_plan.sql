-- Add plan column to users table for subscription tier tracking
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro'));