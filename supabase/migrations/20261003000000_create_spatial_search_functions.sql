-- 現場座標から指定半径（km）以内のパートナー作業員を抽出する関数
CREATE OR REPLACE FUNCTION public.get_nearby_partner_workers(
  target_lat DOUBLE PRECISION,
  target_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 30.0
)
RETURNS TABLE (
  worker_id UUID,
  worker_name TEXT,
  base_address TEXT,
  distance_km DOUBLE PRECISION
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
    )::double precision AS distance_km
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

-- 権限付与
GRANT EXECUTE ON FUNCTION public.get_nearby_partner_workers TO authenticated, service_role;