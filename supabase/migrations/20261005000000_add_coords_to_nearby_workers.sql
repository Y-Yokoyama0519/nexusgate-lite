-- 1. 戻り値列が異なるため既存の関数を一旦削除
DROP FUNCTION IF EXISTS public.get_nearby_partner_workers(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);

-- 2. lat, lng を含めた戻り値型で新規作成
CREATE OR REPLACE FUNCTION public.get_nearby_partner_workers(
  target_lat DOUBLE PRECISION,
  target_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 30.0
)
RETURNS TABLE (
  worker_id UUID,
  worker_name TEXT,
  base_address TEXT,
  distance_km DOUBLE PRECISION,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pw.id AS worker_id,
    pw.name AS worker_name,
    pw.base_address,
    ROUND(
      (ST_Distance(
        pw.base_location,
        ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography
      ) / 1000.0)::numeric,
      1
    )::double precision AS distance_km,
    ST_Y(pw.base_location::geometry) AS lat,
    ST_X(pw.base_location::geometry) AS lng
  FROM
    public.partner_workers pw
  WHERE
    pw.base_location IS NOT NULL
    AND ST_DWithin(
      pw.base_location,
      ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography,
      COALESCE(radius_km, 30.0) * 1000.0
    )
  ORDER BY
    distance_km ASC;
$$;

-- 3. 権限付与
GRANT EXECUTE ON FUNCTION public.get_nearby_partner_workers TO authenticated, service_role;