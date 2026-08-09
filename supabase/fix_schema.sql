-- ReddigInsight 数据库表结构修复 v2
-- 在 Supabase SQL Editor 中执行
-- 更新日期: 2026-07-09

-- 1. 添加后端代码需要的列

-- 添加 keywords 列（JSONB 数组）
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS keywords JSONB DEFAULT '[]'::jsonb;

-- 添加 title 列
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS title TEXT;

-- 添加 description 列
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 添加 max_results 列
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS max_results INTEGER DEFAULT 50;

-- 添加 pmf_score 列
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS pmf_score DECIMAL(5,2);

-- 添加 apify_task_id 列
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS apify_task_id TEXT;

-- 添加 data 列（JSONB，存储完整报告分析数据）
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS data JSONB;

-- 添加 status_message 列
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS status_message TEXT;

-- 添加 total_posts 列
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS total_posts INTEGER DEFAULT 0;

-- 添加 error 列
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS error TEXT;

-- 添加 subreddit 列（如果不存在）
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS subreddit TEXT;

-- 2. 修复 status CHECK 约束，添加 timed_out
DO $$ 
BEGIN
  -- 先删除旧约束
  ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_status_check;
  -- 添加新约束（包含 timed_out）
  ALTER TABLE public.reports ADD CONSTRAINT reports_status_check 
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'timed_out'));
END $$;

-- 确保 crawled_posts 表有正确结构
ALTER TABLE public.crawled_posts 
ADD COLUMN IF NOT EXISTS subreddit TEXT;

-- 验证表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'reports'
ORDER BY ordinal_position;