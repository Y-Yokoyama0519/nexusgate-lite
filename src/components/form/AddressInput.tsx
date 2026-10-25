'use client'

import { useState, useTransition, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { lookupPostalCodeAction, verifyAddressAction } from '@/app/actions/geo'
import { type GeocodeResult } from '@/lib/geo/address'
import { Search, Loader2 } from 'lucide-react'

interface AddressInputProps {
  postalCodeName?: string
  defaultPostalCode?: string
  addressName?: string
  defaultAddress?: string
  address2Name?: string
  defaultAddress2?: string
  initialGeocodeLevel?: number | null
  required?: boolean
  addressError?: string
}

export function AddressInput({
  postalCodeName = 'postal_code',
  defaultPostalCode = '',
  addressName = 'address',
  defaultAddress = '',
  address2Name = 'address2',
  defaultAddress2 = '',
  initialGeocodeLevel = null,
  required = false,
  addressError,
}: AddressInputProps) {
  const [postalCode, setPostalCode] = useState(defaultPostalCode)
  const [address, setAddress] = useState(defaultAddress)
  const [address2, setAddress2] = useState(defaultAddress2)
  const [postalError, setPostalError] = useState<string | null>(null)

  const [isSearchingPostal, startPostalTransition] = useTransition()
  const [isValidatingGeo, startGeoTransition] = useTransition()
  const [geoResult, setGeoResult] = useState<GeocodeResult | null>(null)
  const [hasGeoChecked, setHasGeoChecked] = useState(false)

  const address2InputRef = useRef<HTMLInputElement>(null)

  const executeGeoLookup = (addrStr: string) => {
    const val = addrStr.trim()
    if (!val) {
      setGeoResult(null)
      setHasGeoChecked(false)
      return
    }

    startGeoTransition(async () => {
      try {
        const res = await verifyAddressAction(val)
        setGeoResult(res)
      } catch {
        setGeoResult(null)
      } finally {
        setHasGeoChecked(true)
      }
    })
  }

  const handlePostalSearch = () => {
    const clean = postalCode.replace(/[^\d]/g, '')
    if (clean.length !== 7) {
      setPostalError('半角数字7桁で入力してください')
      return
    }

    setPostalError(null)
    startPostalTransition(async () => {
      const foundAddress = await lookupPostalCodeAction(clean)
      if (foundAddress) {
        setAddress(foundAddress)
        executeGeoLookup(foundAddress)
      } else {
        setPostalError('該当する住所が見つかりませんでした')
      }
    })
  }

  const handlePostalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handlePostalSearch()
    }
  }

  const handleAddressKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      executeGeoLookup(address)
      address2InputRef.current?.focus()
    }
  }

  const handleAddressBlur = () => {
    executeGeoLookup(address)
  }

  // 表示対象の Level（リアルタイム検証結果を優先、未検証時は初期データから判定）
  const activeLevel = hasGeoChecked
    ? geoResult?.level ?? null
    : initialGeocodeLevel

  const activeNormalizedAddress = hasGeoChecked
    ? geoResult?.normalizedAddress ?? null
    : null

  const isCheckingAddress = hasGeoChecked || (initialGeocodeLevel != null && address.trim() !== '')

  return (
    <div className="space-y-4">
      {/* 郵便番号 */}
      <div className="space-y-1.5">
        <Label htmlFor={postalCodeName}>郵便番号</Label>
        <div className="flex items-center gap-2 max-w-sm">
          <Input
            id={postalCodeName}
            name={postalCodeName}
            value={postalCode}
            onChange={(e) => {
              setPostalCode(e.target.value)
              if (postalError) setPostalError(null)
            }}
            onKeyDown={handlePostalKeyDown}
            placeholder="例: 7600017"
            maxLength={8}
            className="w-36"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handlePostalSearch}
            disabled={isSearchingPostal || !postalCode.trim()}
            className="gap-1.5 shrink-0"
          >
            {isSearchingPostal ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            住所検索
          </Button>
        </div>
        {postalError && <p className="text-xs text-destructive">{postalError}</p>}
      </div>

      {/* 住所（番地まで） */}
      <div className="space-y-1.5">
        <Label htmlFor={addressName}>
          所在地 / 住所（番地まで）
          {required && <span className="text-destructive">*</span>}
        </Label>
        <div className="relative">
          <Input
            id={addressName}
            name={addressName}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={handleAddressKeyDown}
            onBlur={handleAddressBlur}
            placeholder="例: 香川県高松市番町4丁目1-10"
            required={required}
          />
          {isValidatingGeo && (
            <span className="absolute right-3 top-2 text-xs text-muted-foreground flex items-center gap-1 animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" />
              座標確認中...
            </span>
          )}
        </div>

        {/* 座標判定ステータス表示 */}
        {!isValidatingGeo && isCheckingAddress && (
          <div className="text-xs space-y-0.5 mt-1">
            {hasGeoChecked ? (
              geoResult ? (
                geoResult.level >= 4 ? (
                  <p className="text-emerald-600 dark:text-emerald-400">
                    ✓ 座標特定済 (Level {geoResult.level}: {geoResult.normalizedAddress})
                  </p>
                ) : (
                  <p className="text-amber-600 dark:text-amber-400">
                    目安位置で登録されます (Level {geoResult.level}: {geoResult.normalizedAddress})
                  </p>
                )
              ) : (
                <p className="text-muted-foreground">
                  ※ 該当する住所情報が見つかりませんでした
                </p>
              )
            ) : initialGeocodeLevel != null ? (
              initialGeocodeLevel >= 4 ? (
                <p className="text-emerald-600 dark:text-emerald-400">
                  ✓ 座標特定済 (Level {initialGeocodeLevel})
                </p>
              ) : (
                <p className="text-amber-600 dark:text-amber-400">
                  目安位置で登録されます (Level {initialGeocodeLevel})
                </p>
              )
            ) : null}
          </div>
        )}

        {addressError && <p className="text-sm text-destructive">{addressError}</p>}
      </div>

      {/* 建物名・部屋番号 */}
      <div className="space-y-1.5">
        <Label htmlFor={address2Name}>建物名・階数・部屋番号（任意）</Label>
        <Input
          ref={address2InputRef}
          id={address2Name}
          name={address2Name}
          value={address2}
          onChange={(e) => setAddress2(e.target.value)}
          placeholder="例: 香川県庁舎 本館3F"
        />
      </div>
    </div>
  )
}