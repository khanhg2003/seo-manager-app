-- ==========================================
-- BƯỚC 1: XÓA CÁC BẢNG CŨ NẾU CÓ ĐỂ LÀM SẠCH (Cẩn thận nều đã có dữ liệu quan trọng)
-- ==========================================
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.phases CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ==========================================
-- BƯỚC 2: TẠO BẢNG MỚI THEO CHUẨN SRS
-- ==========================================

-- 1. Table: PROFILES
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('manager', 'assistant')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- 2. Table: PROJECTS
CREATE TABLE public.projects (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  domain text,
  status text DEFAULT 'active'::text NOT NULL CHECK (status IN ('active', 'paused', 'completed')),
  color text DEFAULT '#3b82f6'::text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- 3. Table: PHASES
CREATE TABLE public.phases (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index integer NOT NULL,
  status text DEFAULT 'active'::text NOT NULL CHECK (status IN ('active', 'completed')),
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at timestamp with time zone,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- 4. Table: TASKS
CREATE TABLE public.tasks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_id uuid NOT NULL REFERENCES public.phases(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text DEFAULT 'todo'::text NOT NULL CHECK (status IN ('todo', 'in_progress', 'in_review', 'done')),
  priority text DEFAULT 'normal'::text NOT NULL CHECK (priority IN ('normal', 'high', 'urgent')),
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date timestamp with time zone,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- ==========================================
-- BƯỚC 3: TRIGGER SINH TỰ ĐỘNG 6 PHASES MẶC ĐỊNH
-- ==========================================
CREATE OR REPLACE FUNCTION public.create_default_phases()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.phases (project_id, name, order_index, created_by)
  VALUES 
    (NEW.id, 'Technical Audit', 1, NEW.created_by),
    (NEW.id, 'Keyword Research', 2, NEW.created_by),
    (NEW.id, 'Content Production', 3, NEW.created_by),
    (NEW.id, 'On-page Optimization', 4, NEW.created_by),
    (NEW.id, 'Entity/Social Building', 5, NEW.created_by),
    (NEW.id, 'Off-page & Link Building', 6, NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_default_phases ON public.projects;
CREATE TRIGGER trigger_create_default_phases
AFTER INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.create_default_phases();

-- ==========================================
-- BƯỚC 4: THIẾT LẬP RLS (ROW LEVEL SECURITY)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Hàm (Function) để kiểm tra user hiện tại có phải Manager không
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'manager'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 4.1 Profiles Policy
CREATE POLICY "Cho phép xem tất cả profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Cho phép tự Insert profile lúc đăng nhập" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 4.2 Projects Policy
-- Manager và Assistant đều đọc được project
CREATE POLICY "Read projects" ON public.projects FOR SELECT USING (true);
-- Assistant KHÔNG ĐƯỢC DELETE project. Manager được làm mọi thứ
CREATE POLICY "Manager All Projects" ON public.projects FOR ALL USING (public.is_manager());
CREATE POLICY "Assistant Insert/Update Projects" ON public.projects FOR INSERT WITH CHECK (NOT public.is_manager());
CREATE POLICY "Assistant Update Projects" ON public.projects FOR UPDATE USING (NOT public.is_manager());

-- 4.3 Phases Policy
CREATE POLICY "Read phases" ON public.phases FOR SELECT USING (true);
CREATE POLICY "Assistant và Manager được tạo phase mới" ON public.phases FOR INSERT WITH CHECK (true);
CREATE POLICY "Assistant chỉ sửa thông thường, KHÔNG XÓA được, KHÔNG DUYỆT được" ON public.phases 
FOR UPDATE USING (
  -- Cho sửa, nhưng hệ thống sẽ chặn update 'status' thành completed nếu không phải manager (Xem Logic Check bên dưới)
  true 
);
CREATE POLICY "Manager được làm mọi thứ trên Phase" ON public.phases FOR ALL USING (public.is_manager());

-- 4.4 Tasks Policy
CREATE POLICY "Tất cả user đọc được mọi task" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Tất cả user được làm mọi thao tác trên Task" ON public.tasks FOR ALL USING (true);

-- ==========================================
-- BƯỚC 5: TRIGGER CHẶN ASSISTANT DUYỆT PHASE BẰNG HÀM CHECK
-- ==========================================
CREATE OR REPLACE FUNCTION public.check_phase_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Nếu trạng thái phase thay đổi thành completed hoặc approved_by thay đổi
  IF (NEW.status = 'completed' AND OLD.status != 'completed') OR (NEW.approved_by IS NOT NULL AND OLD.approved_by IS NULL) THEN
    -- Bắt buộc người thực hiện thay đổi phải là Manager
    IF NOT public.is_manager() THEN
      RAISE EXCEPTION 'PERMISSION DENIED: Chỉ có Manager mới được quyền Approve Phase.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_check_phase_approval ON public.phases;
CREATE TRIGGER trigger_check_phase_approval
BEFORE UPDATE ON public.phases
FOR EACH ROW
EXECUTE FUNCTION public.check_phase_approval();
