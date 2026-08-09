-- Fix inconsistency in crawled_posts table by removing the duplicate reddit_post_id column
-- and standardizing on reddit_id as the canonical field for Reddit post identifiers.

-- Drop redundant reddit_post_id column
ALTER TABLE public.crawled_posts 
DROP COLUMN IF EXISTS reddit_post_id;

-- Ensure reddit_id column exists and maintain unique constraint if needed
DO $$ 
BEGIN
    -- Add reddit_id column if missing (should exist from schema.sql but ensure it's there)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'crawled_posts' AND column_name = 'reddit_id') THEN
        ALTER TABLE public.crawled_posts 
        ADD COLUMN reddit_id TEXT NOT NULL;
    END IF;
    
    -- Add unique constraint to prevent duplicate Reddit posts (if not already present)
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'crawled_posts_reddit_id_key') THEN
        ALTER TABLE public.crawled_posts 
        ADD CONSTRAINT crawled_posts_reddit_id_key UNIQUE (reddit_id);
    END IF;
END $$;