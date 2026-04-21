-- ==========================================
-- SCRIPT: Tắt Bảo mật để Test không cần Đăng nhập
-- Dành riêng cho chế độ Bypass (V2 - Fix lỗi UUID)
-- ==========================================

-- 1. Bỏ khóa ngoại (Foreign Keys) liên kết với bảng auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_created_by_fkey;
ALTER TABLE public.phases DROP CONSTRAINT IF EXISTS phases_created_by_fkey;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;

ALTER TABLE public.phases DROP CONSTRAINT IF EXISTS phases_approved_by_fkey;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;

-- 2. Tắt RLS (Row Level Security) - Cho phép đọc/ghi thoải mái
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.phases DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

-- 3. Bỏ qua logic chặn Duyệt Phase bằng Trigger (Chỉ Manager mới được duyệt)
DROP TRIGGER IF EXISTS trigger_check_phase_approval ON public.phases;

-- 4. Cho phép insert profile bằng ID UUID mẫu
INSERT INTO public.profiles (id, full_name, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'Khách (Bypass)', 'manager')
ON CONFLICT DO NOTHING;
