'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { createPartner } from '@/app/(apps)/operator/partners/actions'
import { type ActionState } from '@/lib/actions/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { AddressInput } from '@/components/form/AddressInput'

const initialState: ActionState = {}

export function PartnerForm() {
  const [state, formAction, isPending] = useActionState(createPartner, initialState)
  const [homeAddress, setHomeAddress] = useState('')
  const [homeAddress2, setHomeAddress2] = useState('')
  const [baseCopyTrigger, setBaseCopyTrigger] = useState<{ address: string; address2: string } | null>(null)

  const handleCopyHomeAddress = () => {
    setBaseCopyTrigger({
      address: homeAddress,
      address2: homeAddress2,
    })
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>新規パートナー登録</CardTitle>
        <CardDescription>
          協力会社・委託先パートナーの基本情報と拠点を登録します。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.errors?.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>システムエラー</AlertTitle>
              <AlertDescription>{state.errors.general.join(', ')}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">
              屋号 / パートナー名 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="例: 合同会社テックフロント / 田中 太郎"
              defaultValue={state?.fields?.name ?? ''}
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
                placeholder="例: 090-1234-5678"
                defaultValue={state?.fields?.phone ?? ''}
              />
              {state?.errors?.phone && (
                <p className="text-sm text-destructive">{state.errors.phone.join(', ')}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">連絡先メールアドレス</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="例: info@example.com"
                defaultValue={state?.fields?.email ?? ''}
              />
              {state?.errors?.email && (
                <p className="text-sm text-destructive">{state.errors.email.join(', ')}</p>
              )}
            </div>
          </div>

          {/* 居住地住所（個人情報扱い・ジオコーディング非対象） */}
          <div className="space-y-3 pt-3 border-t">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">居住住所 / 登記住所</h3>
              <p className="text-xs text-muted-foreground">※身元確認・連絡用の住所です（案件アサインの距離計算には使用されません）。</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="home_address">住所（番地まで）</Label>
              <Input
                id="home_address"
                name="home_address"
                placeholder="例: 香川県高松市瓦町2丁目5-10"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="home_address2">建物名・部屋番号（任意）</Label>
              <Input
                id="home_address2"
                name="home_address2"
                placeholder="例: 瓦町ハイツ 201号室"
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
                <p className="text-xs text-muted-foreground">※案件現場との直線距離および移動時間計算の基準地点となります。</p>
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
              key={baseCopyTrigger ? `${baseCopyTrigger.address}_${baseCopyTrigger.address2}` : 'base_default'}
              postalCodeName="base_postal_code"
              defaultPostalCode={state?.fields?.base_postal_code ?? ''}
              addressName="base_address"
              defaultAddress={baseCopyTrigger ? baseCopyTrigger.address : (state?.fields?.base_address ?? '')}
              address2Name="base_address2"
              defaultAddress2={baseCopyTrigger ? baseCopyTrigger.address2 : (state?.fields?.base_address2 ?? '')}
              addressError={state?.errors?.base_address?.[0]}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Link
              href="/operator/partners"
              className={buttonVariants({ variant: 'outline' })}
            >
              キャンセル
            </Link>
            <Button type="submit" disabled={isPending}>
              {isPending ? '登録中...' : 'パートナーを登録する'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}