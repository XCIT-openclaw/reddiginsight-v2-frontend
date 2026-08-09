-- PMF Score P0 Feature - Database Migration
-- Adds PMF score column to support PMF visualization

-- Add PMF score column to reports table
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS pmf_score DECIMAL(5,2);

-- Add PMF score column to update the table description/indexing
CREATE INDEX IF NOT EXISTS idx_reports_pmf_score ON public.reports(pmf_score);

-- Verify the column was created successfully
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'reports'
  AND column_name = 'pmf_score'
ORDER BY table_name, column_name;