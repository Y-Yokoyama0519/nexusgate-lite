'use client'

import { useActionState, useState } from 'react'
import { createProject } from '@/app/(apps)/operator/projects/actions'
import { type ActionState } from '@/lib/actions/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { AddressInput } from '@/components/form/AddressInput'
import Link from 'next/link'

type CustomerOption = {
  id: string
  name: string
  postal_code?: string | null
  address?: string | null
  address2?: string | null
}

const PROJECT_STATUS_ITEMS = [
  { value: 'draft', label: '下書き (draft)' },
  { value: 'pending_assignment', label: 'アサイン待ち (pending_assignment)' },
  { value: 'assigned', label: 'アサイン済み (assigned)' },
  { value: 'in_progress', label: '進行中 (in_progress)' },
]

const initialState: ActionState = {}

export function ProjectForm({ customers }: { customers: CustomerOption[] }) {
  const [state, formAction, isPending] = useActionState(createProject, initialState)
  const [status, setStatus] = useState<string>('draft')
  const [scheduledStartAt, setScheduledStartAt] = useState<string>('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [copyTrigger, setCopyTrigger] = useState<{
    postal_code: string
    address: string
    address2: string
  } | null>(null)

  const isDraft = status === 'draft'

  const customerItems = customers.map((c) => ({
    value: c.id,
    label: c.name,
  }))

  const handleCopyCustomerAddress = () => {
    const target = customers.find((c) => c.id === selectedCustomerId)
    if (target) {
      setCopyTrigger({
        postal_code: target.postal_code ?? '',
        address: target.address ?? '',
        address2: target.address2 ?? '',
      })
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>新規案件登録</CardTitle>
        <CardDescription>
          新しいプロジェクト・案件情報を登録します。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.errors?.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>{state.errors.general.join(', ')}</AlertDescription>
            </Alert>
          )}

          {/* 発注元顧客 */}
          <div className="space-y-2">
            <Label htmlFor="customer_id_trigger">
              発注元顧客 <span className="text-destructive">*</span>
            </Label>
            <Select
              name="customer_id"
              items={customerItems}
              value={selectedCustomerId}
              onValueChange={(val) => {
                if (typeof val === 'string') setSelectedCustomerId(val)
              }}
              required
            >
              <SelectTrigger id="customer_id_trigger">
                <SelectValue placeholder="顧客を選択してください" />
              </SelectTrigger>
              <SelectContent>
                {customerItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.errors?.customer_id && (
              <p className="text-sm text-destructive">
                {state.errors.customer_id.join(', ')}
              </p>
            )}
          </div>

          {/* 案件名 */}
          <div className="space-y-2">
            <Label htmlFor="title">
              案件名 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="例: 店舗ネットワーク配線工事"
              required
            />
            {state?.errors?.title && (
              <p className="text-sm text-destructive">
                {state.errors.title.join(', ')}
              </p>
            )}
          </div>

          {/* 作業現場住所 */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between pb-1">
              <span className="text-sm font-semibold">作業現場の所在地</span>
              <button
                type="button"
                onClick={handleCopyCustomerAddress}
                disabled={!selectedCustomerId}
                className="text-xs text-primary underline disabled:opacity-50 disabled:no-underline"
              >
                顧客の所在地をコピー
              </button>
            </div>
            <AddressInput
              key={copyTrigger ? `${copyTrigger.postal_code}_${copyTrigger.address}` : 'project_initial'}
              postalCodeName="postal_code"
              defaultPostalCode={copyTrigger ? copyTrigger.postal_code : ''}
              addressName="address"
              defaultAddress={copyTrigger ? copyTrigger.address : ''}
              address2Name="address2"
              defaultAddress2={copyTrigger ? copyTrigger.address2 : ''}
            />
          </div>

          {/* 初期ステータス */}
          <div className="space-y-2">
            <Label htmlFor="status_trigger">初期ステータス</Label>
            <Select
              name="status"
              defaultValue="draft"
              onValueChange={(val) => {
                if (typeof val === 'string') setStatus(val)
              }}
              items={PROJECT_STATUS_ITEMS}
            >
              <SelectTrigger id="status_trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUS_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* スケジュール期間 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_start_at">
                開始予定日時 {!isDraft && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="scheduled_start_at"
                name="scheduled_start_at"
                type="datetime-local"
                required={!isDraft}
                onChange={(e) => setScheduledStartAt(e.target.value)}
              />
              {state?.errors?.scheduled_start_at && (
                <p className="text-sm text-destructive">
                  {state.errors.scheduled_start_at.join(', ')}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_end_at">
                完了予定日時 {!isDraft && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="scheduled_end_at"
                name="scheduled_end_at"
                type="datetime-local"
                required={!isDraft}
                min={scheduledStartAt || undefined}
              />
              {state?.errors?.scheduled_end_at && (
                <p className="text-sm text-destructive">
                  {state.errors.scheduled_end_at.join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* 概要・備考 */}
          <div className="space-y-2">
            <Label htmlFor="description">案件詳細・特記事項</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              placeholder="案件の要件概要や特記事項を入力"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Link
              href="/operator/projects"
              className={buttonVariants({ variant: 'outline' })}
            >
              キャンセル
            </Link>
            <Button type="submit" disabled={isPending}>
              {isPending ? '登録中...' : '案件を登録する'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}