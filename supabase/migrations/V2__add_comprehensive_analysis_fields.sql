-- AI Analysis P0 Features - Database Migration
-- Adds new columns to support comprehensive analysis

-- Add new columns to reports table

ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS discussion_summary JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS key_quotes JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS avg_influence_score DECIMAL(5,2);

ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS action_recommendations JSONB DEFAULT '[]'::jsonb;

-- Add new columns to crawled_posts table

ALTER TABLE public.crawled_posts 
ADD COLUMN IF NOT EXISTS is_key_quote BOOLEAN DEFAULT FALSE;

ALTER TABLE public.crawled_posts 
ADD COLUMN IF NOT EXISTS quote_text TEXT;

ALTER TABLE public.crawled_posts 
ADD COLUMN IF NOT EXISTS influence_score DECIMAL(5,2);

ALTER TABLE public.crawled_posts 
ADD COLUMN IF NOT EXISTS sentiment_confidence DECIMAL(3,2);

ALTER TABLE public.crawled_posts 
ADD COLUMN IF NOT EXISTS action_recommendation TEXT CHECK (action_recommendation IN ('reply', 'suggest', 'ignore'));

-- Verify all columns were created successfully

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('reports', 'crawled_posts')
  AND column_name IN (
    'discussion_summary', 
    'key_quotes', 
    'avg_influence_score', 
    'action_recommendations',
    'is_key_quote',
    'quote_text',
    'influence_score',
    'sentiment_confidence',
    'action_recommendation'
  )
ORDER BY table_name, column_name;