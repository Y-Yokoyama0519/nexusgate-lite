export interface MapPin {
  id: string
  name: string
  lat: number
  lng: number
  type: 'project' | 'partner'
  distanceKm?: number
}

/**
 * 登録不要・無料の Google マップルート案内用 URL を生成
 */
export function buildGoogleMapsRouteUrl(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): string {
  const originParam = encodeURIComponent(`${origin.lat},${origin.lng}`)
  const destParam = encodeURIComponent(`${destination.lat},${destination.lng}`)
  return `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=driving`
}