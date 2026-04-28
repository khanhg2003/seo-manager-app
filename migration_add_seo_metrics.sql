-- ============================================================
-- MIGRATION: Thêm bảng theo dõi chỉ số SEO theo tháng
-- Vui lòng copy và chạy toàn bộ file này trong Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE public.project_seo_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  month text NOT NULL, -- Định dạng: YYYY-MM
  articles_count integer DEFAULT 0,
  gsc_traffic integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(project_id, month)
);

-- Bật RLS
ALTER TABLE public.project_seo_metrics ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- POLICIES CHO BẢNG project_seo_metrics
-- -------------------------------------------------------------------------

-- 1. Ai cũng có thể đọc (Manager và Assistant)
CREATE POLICY "Cho phép đọc project_seo_metrics"
ON public.project_seo_metrics FOR SELECT
USING (true);

-- 2. Manager có toàn quyền (INSERT, UPDATE, DELETE)
CREATE POLICY "Manager All Metrics"
ON public.project_seo_metrics FOR ALL
USING (public.is_manager());

-- 3. Assistant có thể Insert/Update (nhưng dựa vào chính sách giống Tasks/Projects tuỳ logic doanh nghiệp, ở đây cho phép Assistant cập nhật chỉ số SEO)
CREATE POLICY "Assistant Insert/Update Metrics"
ON public.project_seo_metrics FOR INSERT
WITH CHECK (NOT public.is_manager());

CREATE POLICY "Assistant Update Metrics"
ON public.project_seo_metrics FOR UPDATE
USING (NOT public.is_manager());

-- Trigger cập nhật updated_at
CREATE OR REPLACE FUNCTION update_modified_column_seo_metrics()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_seo_metrics_modtime
BEFORE UPDATE ON public.project_seo_metrics
FOR EACH ROW EXECUTE PROCEDURE update_modified_column_seo_metrics();
