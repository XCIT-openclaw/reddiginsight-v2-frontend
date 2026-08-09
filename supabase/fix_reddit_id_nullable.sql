-- 修复 crawled_posts 表约束
-- 在 Supabase SQL Editor 中执行

-- 移除 NOT NULL 约束
ALTER TABLE public.crawled_posts 
ALTER COLUMN reddit_id DROP NOT NULL;

-- 验证
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'crawled_posts' AND column_name IN ('reddit_id', 'reddit_post_id');