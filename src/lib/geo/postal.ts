import { SYSTEM_CONFIG } from '@/config/system'

export interface PostalApiResponse {
  code: string
  data: Array<{
    pref: string
    address: string
    city: string
    town: string
  }>
}

/**
 * madefor/postal-code-api を利用した郵便番号からの住所自動補完
 * @param postalCode 7桁の郵便番号（ハイフン有無問わず）
 * @param baseUrl 郵便番号APIのベースURL（デフォルト: SYSTEM_CONFIG.geo.postalApiBaseUrl）
 */
export async function lookupPostalAddress(
  postalCode: string,
  baseUrl: string = SYSTEM_CONFIG.geo.postalApiBaseUrl
): Promise<string | null> {
  const clean = postalCode?.replace(/[^\d]/g, '')
  if (!clean || clean.length !== 7) return null

  const p3 = clean.slice(0, 3)
  const p4 = clean.slice(3)
  const url = `${baseUrl}/${p3}/${p4}.json`

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return null

    const json = (await res.json()) as PostalApiResponse
    const first = json.data?.[0]
    if (!first) return null

    return `${first.pref}${first.city}${first.town}`
  } catch (error) {
    console.warn('[Postal API] Failed to fetch:', error)
    return null
  }
}