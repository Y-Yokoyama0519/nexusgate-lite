'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { saveCustomer } from '@/app/(apps)/operator/customers/actions'
import { type ActionState } from '@/lib/actions/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { AddressInput } from '@/components/form/AddressInput'
import { type CustomerItem } from '../schema'

interface CustomerFormProps {
  initialData?: CustomerItem | null
}

const initialState: ActionState = {}

export function CustomerForm({ initialData }: CustomerFormProps) {
  const isEdit = !!initialData
  const [state, formAction, isPending] = useActionState(saveCustomer, initialState)

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEdit ? '顧客情報の編集' : '新規顧客登録'}</CardTitle>
        <CardDescription>
          {isEdit
            ? '登録済みの取引先・顧客情報を変更します。'
            : '新しい取引先・顧客情報をシステムに登録します。'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} noValidate className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={initialData.id} />}

          {state?.errors?.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>システムエラー</AlertTitle>
              <AlertDescription>{state.errors.general.join(', ')}</AlertDescription>
            </Alert>
          )}

          {state?.message && !state?.errors?.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>入力エラー</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          {/* 顧客コード */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="customer_code">
                顧客コード / 管理番号 <span className="text-destructive">*</span>
              </Label>
              {isEdit && (
                <span className="text-xs text-muted-foreground">※変更不可（固定識別子）</span>
              )}
            </div>
            <Input
              id="customer_code"
              name="customer_code"
              placeholder="例: SMC00324"
              defaultValue={state?.fields?.customer_code ?? initialData?.customer_code ?? ''}
              readOnly={isEdit}
              className={isEdit ? 'bg-muted/50 cursor-not-allowed font-mono' : 'font-mono'}
            />
            {state?.errors?.customer_code && (
              <p className="text-sm text-destructive">{state.errors.customer_code.join(', ')}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                顧客名 / 会社名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="例: 株式会社サンマルクカフェ"
                defaultValue={state?.fields?.name ?? initialData?.name ?? ''}
              />
              {state?.errors?.name && (
                <p className="text-sm text-destructive">{state.errors.name.join(', ')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name_kana">顧客名フリガナ（検索用）</Label>
              <Input
                id="name_kana"
                name="name_kana"
                placeholder="例: サンマルクカフェ"
                defaultValue={state?.fields?.name_kana ?? initialData?.name_kana ?? ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="branch_name">店舗名 / 支店・拠点名</Label>
              <Input
                id="branch_name"
                name="branch_name"
                placeholder="例: 瓦町FLAG店"
                defaultValue={state?.fields?.branch_name ?? initialData?.branch_name ?? ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_name">担当者名</Label>
              <Input
                id="contact_name"
                name="contact_name"
                placeholder="例: 山田 太郎"
                defaultValue={state?.fields?.contact_name ?? initialData?.contact_name ?? ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="例: 087-812-0001"
                defaultValue={state?.fields?.phone ?? initialData?.phone ?? ''}
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
                placeholder="例: yamada@example.com"
                defaultValue={state?.fields?.email ?? initialData?.email ?? ''}
              />
              {state?.errors?.email && (
                <p className="text-sm text-destructive">{state.errors.email.join(', ')}</p>
              )}
            </div>
          </div>

          <AddressInput
            defaultPostalCode={state?.fields?.postal_code ?? initialData?.postal_code ?? ''}
            defaultAddress={state?.fields?.address ?? initialData?.address ?? ''}
            defaultAddress2={state?.fields?.address2 ?? initialData?.address2 ?? ''}
            addressError={state?.errors?.address?.[0]}
          />

          <div className="space-y-2">
            <Label htmlFor="notes">備考 / 特記事項</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="例: FAX: 087-812-0002 / 搬入口は裏手側"
              rows={3}
              defaultValue={state?.fields?.notes ?? initialData?.notes ?? ''}
            />
          </div>

          {isEdit && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                value="true"
                defaultChecked={initialData?.is_active ?? true}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">
                この顧客を有効として扱う（チェックを外すとアーカイブ・案件選択肢から除外されます）
              </Label>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Link
              href="/operator/customers"
              className={buttonVariants({ variant: 'outline' })}
            >
              {isEdit ? '戻る' : 'キャンセル'}
            </Link>
            <Button type="submit" variant="outline" disabled={isPending} className="font-semibold">
              {isPending
                ? isEdit ? '更新中...' : '登録中...'
                : isEdit ? '顧客情報を更新' : '顧客を登録する'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}