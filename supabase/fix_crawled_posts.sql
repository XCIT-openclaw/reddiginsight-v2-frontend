-- ReddigInsight v2 - 修复 crawled_posts 表结构
-- 在 Supabase SQL Editor 中执行

-- 添加缺失的列
ALTER TABLE public.crawled_posts 
ADD COLUMN IF NOT EXISTS reddit_post_id TEXT;

ALTER TABLE public.crawled_posts 
ADD COLUMN IF NOT EXISTS reddit_id TEXT;

-- 验证表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'crawled_posts'
ORDER BY ordinal_position;