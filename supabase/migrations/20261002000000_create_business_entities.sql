-- =========================================================================
-- 1. 顧客テーブル (customers)
-- =========================================================================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  postal_code TEXT,
  address TEXT,
  location GEOGRAPHY(Point, 4326),
  geocode_level SMALLINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_customers_updated_at 
  BEFORE UPDATE ON public.customers 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_customers_location ON public.customers USING GIST (location);

-- =========================================================================
-- 2. パートナー企業テーブル (partner_companies)
-- =========================================================================
CREATE TABLE public.partner_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  postal_code TEXT,
  address TEXT,
  location GEOGRAPHY(Point, 4326),
  geocode_level SMALLINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_partner_companies_updated_at 
  BEFORE UPDATE ON public.partner_companies 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =========================================================================
-- 3. パートナー作業者テーブル (partner_workers)
--    ※ アサイン・距離計算の基準は base_location（待機場所/拠点）を使用
--    ※ home_address は個人情報として保持（ジオコーディング対象外）
-- =========================================================================
CREATE TABLE public.partner_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.partner_companies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  home_postal_code TEXT,
  home_address TEXT,
  base_postal_code TEXT,
  base_address TEXT,
  base_location GEOGRAPHY(Point, 4326),
  base_geocode_level SMALLINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_partner_workers_updated_at 
  BEFORE UPDATE ON public.partner_workers 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_partner_workers_company_id ON public.partner_workers(company_id);
CREATE INDEX idx_partner_workers_user_id ON public.partner_workers(user_id);
CREATE INDEX idx_partner_workers_base_location ON public.partner_workers USING GIST (base_location);

-- =========================================================================
-- 4. 案件テーブル (projects)
--    ※ 1日に同一作業者が複数案件を担当可能（時間帯重複なし前提）
-- =========================================================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  assigned_worker_id UUID REFERENCES public.partner_workers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'pending_assignment', 'assigned', 'in_progress', 'completed', 'cancelled')
  ),
  scheduled_start_at TIMESTAMPTZ,
  scheduled_end_at TIMESTAMPTZ,
  actual_start_at TIMESTAMPTZ,
  actual_end_at TIMESTAMPTZ,
  postal_code TEXT,
  address TEXT,
  location GEOGRAPHY(Point, 4326),
  geocode_level SMALLINT,
  travel_duration_minutes INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_projects_scheduled_dates CHECK (
    scheduled_start_at IS NULL OR scheduled_end_at IS NULL OR scheduled_end_at >= scheduled_start_at
  ),
  CONSTRAINT chk_projects_actual_dates CHECK (
    actual_start_at IS NULL OR actual_end_at IS NULL OR actual_end_at >= actual_start_at
  )
);

CREATE TRIGGER trg_projects_updated_at 
  BEFORE UPDATE ON public.projects 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_projects_customer_id ON public.projects(customer_id);
CREATE INDEX idx_projects_assigned_worker_id ON public.projects(assigned_worker_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_location ON public.projects USING GIST (location);
CREATE INDEX idx_projects_worker_schedule ON public.projects (assigned_worker_id, scheduled_start_at, scheduled_end_at);

-- =========================================================================
-- 5. パートナーシフトテーブル (partner_shifts)
--    ※ 1作業員・1日につき勤務枠は1レコード（UNIQUE制約）
-- =========================================================================
CREATE TABLE public.partner_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.partner_workers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (
    status IN ('available', 'assigned', 'unavailable')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_shift_times CHECK (end_time > start_time),
  CONSTRAINT uq_partner_shifts_worker_date UNIQUE (worker_id, date)
);

CREATE TRIGGER trg_partner_shifts_updated_at 
  BEFORE UPDATE ON public.partner_shifts 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_partner_shifts_worker_date ON public.partner_shifts(worker_id, date);
CREATE INDEX idx_partner_shifts_date_status ON public.partner_shifts(date, status, worker_id);

-- =========================================================================
-- 6. 行レベルセキュリティ（RLS）と権限設定
-- =========================================================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_shifts ENABLE ROW LEVEL SECURITY;

-- 管理者・オペレーター用フルアクセス
CREATE POLICY "Admins full access to customers" ON public.customers FOR ALL TO authenticated
  USING (public.get_my_role() IN ('admin_operator', 'admin_super', 'admin_accounting'));

CREATE POLICY "Admins full access to partner_companies" ON public.partner_companies FOR ALL TO authenticated
  USING (public.get_my_role() IN ('admin_operator', 'admin_super', 'admin_accounting'));

CREATE POLICY "Admins full access to partner_workers" ON public.partner_workers FOR ALL TO authenticated
  USING (public.get_my_role() IN ('admin_operator', 'admin_super', 'admin_accounting'));

CREATE POLICY "Admins full access to projects" ON public.projects FOR ALL TO authenticated
  USING (public.get_my_role() IN ('admin_operator', 'admin_super', 'admin_accounting'));

CREATE POLICY "Admins full access to partner_shifts" ON public.partner_shifts FOR ALL TO authenticated
  USING (public.get_my_role() IN ('admin_operator', 'admin_super', 'admin_accounting'));

-- パートナー自身のアサイン案件閲覧ポリシー
CREATE POLICY "Partners view assigned projects" ON public.projects FOR SELECT TO authenticated
  USING (assigned_worker_id IN (SELECT id FROM public.partner_workers WHERE user_id = auth.uid()));

-- テーブル権限付与
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;