'use server'

import { geocodeAddress, type GeocodeResult } from '@/lib/geo/address'
import { lookupPostalAddress } from '@/lib/geo/postal'

/**
 * 郵便番号（7桁）から住所文字列を取得する Server Action
 * - ローカルの postal_master.csv（インメモリMap）から高速引き当て
 * - 入力補助専用のため、見つからない場合は null を返却
 */
export async function lookupPostalCodeAction(
  postalCode: string
): Promise<string | null> {
  const clean = postalCode?.replace(/[^\d]/g, '')
  if (!clean || clean.length !== 7) {
    return null
  }

  return await lookupPostalAddress(clean)
}

/**
 * 住所の座標・Level判定を非同期で確認するための Server Action（国土地理院API）
 */
export async function verifyAddressAction(
  address: string
): Promise<GeocodeResult | null> {
  const trimmed = address?.trim()
  if (!trimmed) {
    return null
  }

  return await geocodeAddress(trimmed)
}