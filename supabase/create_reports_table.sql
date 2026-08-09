-- ReddigInsight v2 - 创建 reports 表
-- 在 Supabase SQL Editor 中执行

-- 创建 reports 表
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subreddit TEXT NOT NULL,
    title TEXT,
    description TEXT,
    keywords JSONB DEFAULT '[]'::jsonb,
    max_results INTEGER DEFAULT 50,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    pmf_score DECIMAL(5,2),
    apify_task_id TEXT,
    error TEXT,
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 crawled_posts 表（存储爬取的帖子）
CREATE TABLE IF NOT EXISTS public.crawled_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
    reddit_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    subreddit TEXT NOT NULL,
    author TEXT,
    upvotes INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    post_url TEXT,
    posted_at TIMESTAMPTZ,
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    sentiment_score DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_crawled_posts_report_id ON public.crawled_posts(report_id);
CREATE INDEX IF NOT EXISTS idx_crawled_posts_subreddit ON public.crawled_posts(subreddit);

-- 启用 RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawled_posts ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能查看自己的报告
CREATE POLICY "Users can view own reports" ON public.reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" ON public.reports
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports" ON public.reports
    FOR DELETE USING (auth.uid() = user_id);

-- RLS 策略：用户只能查看自己报告的帖子
CREATE POLICY "Users can view own crawled posts" ON public.crawled_posts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.reports 
            WHERE reports.id = crawled_posts.report_id 
            AND reports.user_id = auth.uid()
        )
    );

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reports_updated_at 
    BEFORE UPDATE ON public.reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 验证表创建
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('reports', 'crawled_posts');