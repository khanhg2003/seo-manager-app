-- ============================================================
-- MIGRATION: Thêm các cột còn thiếu vào các bảng hiện có
-- Chạy file này trong Supabase Dashboard > SQL Editor
-- ============================================================

-- ---- 1. Bảng PROFILES ----
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL;

-- ---- 2. Bảng PROJECTS ----
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS google_sheet_id text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL;

-- ---- 3. Bảng PHASES ----
ALTER TABLE public.phases
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL;

-- ---- 4. Bảng TASKS ----
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS output_url text,
  ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS is_reviewed boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL;

-- ============================================================
-- Kiểm tra lại cấu trúc sau khi chạy (tuỳ chọn)
-- ============================================================
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'projects' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tasks' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position;
