ALTER TABLE public.customers
ADD COLUMN customer_code TEXT NOT NULL,
ADD COLUMN name_kana TEXT,
ADD COLUMN branch_name TEXT,
ADD COLUMN notes TEXT,
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- 顧客コードの一意性制約
CREATE UNIQUE INDEX idx_customers_customer_code_unique
ON public.customers (customer_code);

-- 検索用インデックス
CREATE INDEX idx_customers_name_kana ON public.customers (name_kana);
CREATE INDEX idx_customers_is_active ON public.customers (is_active);