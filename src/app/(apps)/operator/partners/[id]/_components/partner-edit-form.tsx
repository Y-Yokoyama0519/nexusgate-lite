'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { updatePartner } from '@/app/(apps)/operator/partners/actions'
import { type ActionState } from '@/lib/actions/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Check } from 'lucide-react'
import { type PartnerItem } from '../../schema'
import { AddressInput } from '@/components/form/AddressInput'

const initialState: ActionState = {}

export function PartnerEditForm({ partner }: { partner: PartnerItem }) {
  const [state, formAction, isPending] = useActionState(updatePartner, initialState)
  const [homeAddress, setHomeAddress] = useState(partner.home_address ?? '')
  const [homeAddress2, setHomeAddress2] = useState(partner.home_address2 ?? '')
  const [baseCopyTrigger, setBaseCopyTrigger] = useState<{ address: string; address2: string } | null>(null)

  const handleCopyHomeAddress = () => {
    setBaseCopyTrigger({
      address: homeAddress,
      address2: homeAddress2,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>基本情報</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={partner.id} />

          {state?.errors?.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>{state.errors.general.join(', ')}</AlertDescription>
            </Alert>
          )}

          {state?.message && !state?.errors?.general && (
            <Alert className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">
              屋号 / パートナー名 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              defaultValue={state?.fields?.name ?? partner.name}
              required
            />
            {state?.errors?.name && (
              <p className="text-sm text-destructive">{state.errors.name.join(', ')}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={state?.fields?.phone ?? partner.phone ?? ''}
              />
              {state?.errors?.phone && (
                <p className="text-sm text-destructive">{state.errors.phone.join(', ')}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={state?.fields?.email ?? partner.email ?? ''}
              />
              {state?.errors?.email && (
                <p className="text-sm text-destructive">{state.errors.email.join(', ')}</p>
              )}
            </div>
          </div>

          {/* 居住地住所 */}
          <div className="space-y-3 pt-3 border-t">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">居住住所 / 登記住所</h3>
              <p className="text-xs text-muted-foreground">※身元確認・連絡用の住所です。</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="home_address">住所（番地まで）</Label>
              <Input
                id="home_address"
                name="home_address"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="home_address2">建物名・部屋番号（任意）</Label>
              <Input
                id="home_address2"
                name="home_address2"
                value={homeAddress2}
                onChange={(e) => setHomeAddress2(e.target.value)}
              />
            </div>
          </div>

          {/* 待機場所・出発拠点（ジオコーディング対象） */}
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">待機場所 / 出発拠点</h3>
                <p className="text-xs text-muted-foreground">※案件アサイン時の距離計算の基準地点です。</p>
              </div>
              <button
                type="button"
                onClick={handleCopyHomeAddress}
                className="text-xs text-primary underline shrink-0"
              >
                居住住所をコピー
              </button>
            </div>

            <AddressInput
              key={baseCopyTrigger ? `${baseCopyTrigger.address}_${baseCopyTrigger.address2}` : 'base_initial'}
              postalCodeName="base_postal_code"
              defaultPostalCode={state?.fields?.base_postal_code ?? partner.base_postal_code ?? ''}
              addressName="base_address"
              defaultAddress={baseCopyTrigger ? baseCopyTrigger.address : (state?.fields?.base_address ?? partner.base_address ?? '')}
              address2Name="base_address2"
              defaultAddress2={baseCopyTrigger ? baseCopyTrigger.address2 : (state?.fields?.base_address2 ?? partner.base_address2 ?? '')}
              addressError={state?.errors?.base_address?.[0]}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Link
              href="/operator/partners"
              className={buttonVariants({ variant: 'outline' })}
            >
              戻る
            </Link>
            <Button type="submit" disabled={isPending}>
              {isPending ? '更新中...' : '基本情報を更新'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}