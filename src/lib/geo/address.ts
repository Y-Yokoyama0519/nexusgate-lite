import { SYSTEM_CONFIG } from '@/config/system'

export interface GeocodeResult {
  lat: number
  lng: number
  level: number // 1: 広域/未特定, 2: 都道府県, 3: 市区町村, 4: 町丁目・大字, 5: 街区・番地
  normalizedAddress: string
}

interface GsiGeocodeItem {
  geometry: {
    coordinates: [number, number]
  }
  properties: {
    title: string
  }
}

export function sanitizeAddress(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/[ー〜～]/g, '-')
    .replace(/\s+/g, '')
    .replace(/-+/g, '-')
    .replace(/[-#]+$/, '')
}

/**
 * 国土地理院 API の特定結果（末尾）から解像精度レベル (1〜5) を判定
 */
function determineGeocodeLevel(title: string): number {
  const trimmed = title.trim()

  // Level 5: 街区・番地・号
  // 全角数字（５番２１号、１５７４番地）、半角数字（5番21号）、全角ハイフン（５－２１）、半角ハイフン（5-21）の全てを直接網羅
  if (
    /(?:[0-9０-９一二三四五六七八九十百]+(?:番|番地|地|号)?|[0-9０-９]+[-－ー][0-9０-９]+)$/.test(trimmed)
  ) {
    return 5
  }

  // Level 4: 町丁目・大字（丁目、大字、字、町）
  if (/(?:丁目|大字|字|町)$/.test(trimmed)) {
    return 4
  }

  // Level 3: 市区町村（市、区、町、村、郡）
  if (/(?:市|区|町|村|郡)$/.test(trimmed)) {
    return 3
  }

  // Level 2: 都道府県（都、道、府、県）
  if (/(?:都|道|府|県)$/.test(trimmed)) {
    return 2
  }

  return 1
}

export async function geocodeAddress(
  address: string | null | undefined,
  apiUrl: string = SYSTEM_CONFIG.geo.gsiAddressSearchUrl
): Promise<GeocodeResult | null> {
  if (!address || !address.trim()) return null

  const cleaned = sanitizeAddress(address)
  if (!cleaned) return null

  try {
    const encoded = encodeURIComponent(cleaned)
    const res = await fetch(`${apiUrl}?q=${encoded}`)

    if (!res.ok) {
      console.warn(`[GSI] HTTP status ${res.status} for: ${cleaned}`)
      return null
    }

    const data = (await res.json()) as GsiGeocodeItem[]

    if (!Array.isArray(data) || data.length === 0) {
      console.warn(`[GSI] Address not found: ${cleaned}`)
      return null
    }

    const [lng, lat] = data[0].geometry.coordinates

    if (
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      Number.isNaN(lat) ||
      Number.isNaN(lng)
    ) {
      console.warn(`[GSI] Invalid coordinates returned for: ${cleaned}`)
      return null
    }

    const normalizedAddress = data[0].properties.title || cleaned
    const level = determineGeocodeLevel(normalizedAddress)

    return {
      lat,
      lng,
      level,
      normalizedAddress,
    }
  } catch (error) {
    console.error('[GSI] Geocode error:', error)
    return null
  }
}

export function toPostGisPoint(geo: { lat: number; lng: number } | null | undefined): string | null {
  if (!geo) return null
  if (Number.isNaN(geo.lat) || Number.isNaN(geo.lng)) return null
  return `SRID=4326;POINT(${geo.lng} ${geo.lat})`
}

export interface ResolvedLocation {
  locationPoint: string | null
  geocodeLevel: number | null
}

/**
 * 入力住所と既存データから座標情報を安全に解決する共通ヘルパー
 */
export async function resolveAddressLocation(params: {
  newAddress?: string | null
  currentAddress?: string | null
  currentLocation?: unknown
  currentGeocodeLevel?: number | null
}): Promise<ResolvedLocation> {
  const trimmed = params.newAddress?.trim()

  if (!trimmed) {
    return { locationPoint: null, geocodeLevel: null }
  }

  // 編集時かつ住所文字列に変更がない場合は既存の座標を維持
  if (params.currentAddress && trimmed === params.currentAddress.trim()) {
    return {
      locationPoint: typeof params.currentLocation === 'string' ? params.currentLocation : null,
      geocodeLevel: params.currentGeocodeLevel ?? null,
    }
  }

  // 新規または住所変更時のみジオコーディング実行
  const geo = await geocodeAddress(trimmed)
  if (geo) {
    return {
      locationPoint: toPostGisPoint(geo),
      geocodeLevel: geo.level,
    }
  }

  return { locationPoint: null, geocodeLevel: null }
}