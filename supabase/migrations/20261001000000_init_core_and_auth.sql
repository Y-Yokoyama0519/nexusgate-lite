-- 1. PostGIS 拡張の有効化（地理空間情報処理用）
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. updated_at 自動更新共通トリガー関数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. profiles テーブル（認証 auth.users と連動したロール管理）
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('partner', 'admin_operator', 'admin_accounting', 'admin_super')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. 実行中ユーザーのロール判定関数（RLS再帰防止・SECURITY DEFINER）
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- profiles 向け RLS ポリシー
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Super admin can manage all profiles"
ON public.profiles FOR ALL TO authenticated USING (public.get_my_role() = 'admin_super');

-- 5. 基本権限付与
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_role TO authenticated, service_role;