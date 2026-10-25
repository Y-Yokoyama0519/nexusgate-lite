-- 1. 顧客テーブル（address2 は任意・NULL許容）
ALTER TABLE public.customers
ADD COLUMN address2 TEXT;

-- 2. パートナー企業テーブル
ALTER TABLE public.partner_companies
ADD COLUMN address2 TEXT;

-- 3. パートナー作業者テーブル（home/base ともに NULL 許容）
ALTER TABLE public.partner_workers
ADD COLUMN home_address2 TEXT,
ADD COLUMN base_address2 TEXT;

-- 4. 案件テーブル（作業現場の建物名・部屋番号、NULL許容）
ALTER TABLE public.projects
ADD COLUMN address2 TEXT;