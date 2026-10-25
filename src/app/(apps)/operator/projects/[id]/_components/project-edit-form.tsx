'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { updateProject } from '@/app/(apps)/operator/projects/actions'
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserCheck, UserX, Navigation } from 'lucide-react'
import { SlotAssigner } from '../../_components/slot-assigner'
import { type ProjectEditData } from '../../schema'
import { AddressInput } from '@/components/form/AddressInput'

interface CustomerOption {
  id: string
  name: string
  postal_code?: string | null
  address?: string | null
  address2?: string | null
}

const statusOptions = [
  { value: 'draft', label: '下書き' },
  { value: 'pending_assignment', label: 'アサイン待ち' },
  { value: 'assigned', label: 'アサイン済み' },
  { value: 'in_progress', label: '進行中' },
  { value: 'completed', label: '完了' },
  { value: 'cancelled', label: 'キャンセル' },
]

function toLocalDatetime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 16)
}

function extractDateOnly(iso: string | null): string {
  if (!iso) return new Date().toISOString().slice(0, 10)
  const d = new Date(iso)
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10)
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 10)
}

export function ProjectEditForm({
  project,
  customers,
}: {
  project: ProjectEditData
  customers: CustomerOption[]
}) {
  const [state, formAction, isPending] = useActionState(updateProject, {})
  const [selectedCustomerId, setSelectedCustomerId] = useState(project.customer_id)
  const [currentAddress, setCurrentAddress] = useState(project.address ?? '')
  const [status, setStatus] = useState(project.status)

  const [assignedWorker, setAssignedWorker] = useState<{ id: string; name: string } | null>(
    project.assigned_worker_id && project.partner_workers
      ? { id: project.assigned_worker_id, name: project.partner_workers.name }
      : null
  )
  const [assignedWorkerCoords, setAssignedWorkerCoords] = useState<{
    lat: number
    lng: number
  } | null>(null)

  const [scheduledStartAt, setScheduledStartAt] = useState(toLocalDatetime(project.scheduled_start_at))
  const [scheduledEndAt, setScheduledEndAt] = useState(toLocalDatetime(project.scheduled_end_at))
  const [targetDate, setTargetDate] = useState(extractDateOnly(project.scheduled_start_at))

  const [copyTrigger, setCopyTrigger] = useState<{
    postal_code: string
    address: string
    address2: string
  } | null>(null)

  const handleCopyCustomerAddress = () => {
    const target = customers.find((c) => c.id === selectedCustomerId)
    if (target) {
      setCopyTrigger({
        postal_code: target.postal_code ?? '',
        address: target.address ?? '',
        address2: target.address2 ?? '',
      })
      setCurrentAddress(target.address ?? '')
    }
  }

  const handleSelectPartner = (slot: {
    workerId: string
    workerName: string
    workerCoords?: { lat: number; lng: number }
  }) => {
    setAssignedWorker({ id: slot.workerId, name: slot.workerName })
    if (slot.workerCoords) {
      setAssignedWorkerCoords(slot.workerCoords)
    }
    if (status === 'draft' || status === 'pending_assignment') {
      setStatus('assigned')
    }
  }

  const handleClearAssignment = () => {
    setAssignedWorker(null)
    setAssignedWorkerCoords(null)
    if (status === 'assigned') {
      setStatus('pending_assignment')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>案件情報の編集</CardTitle>
        <CardDescription>
          現場住所と希望日程から周辺パートナーのシフト状況を照会し、アサインを確定します。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="id" value={project.id} />
          <input type="hidden" name="assigned_worker_id" value={assignedWorker?.id ?? ''} />

          {state?.message && (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer_id">顧客 *</Label>
              <Select
                name="customer_id"
                value={selectedCustomerId}
                onValueChange={(val) => {
                  if (typeof val === 'string') setSelectedCustomerId(val)
                }}
                items={customers.map((c) => ({ value: c.id, label: c.name }))}
                required
              >
                <SelectTrigger id="customer_id">
                  <SelectValue placeholder="顧客を選択" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">案件名 *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={project.title}
                required
              />
            </div>

            {/* 作業現場住所 */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between pb-1">
                <span className="text-sm font-semibold">作業現場の所在地</span>
                <button
                  type="button"
                  onClick={handleCopyCustomerAddress}
                  className="text-xs text-primary underline"
                >
                  顧客の所在地をコピー
                </button>
              </div>
              <AddressInput
                key={copyTrigger ? `${copyTrigger.postal_code}_${copyTrigger.address}` : 'project_edit'}
                postalCodeName="postal_code"
                defaultPostalCode={copyTrigger ? copyTrigger.postal_code : (project.postal_code ?? '')}
                addressName="address"
                defaultAddress={copyTrigger ? copyTrigger.address : (project.address ?? '')}
                address2Name="address2"
                defaultAddress2={copyTrigger ? copyTrigger.address2 : (project.address2 ?? '')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">ステータス</Label>
              <Select
                name="status"
                value={status}
                onValueChange={(val) => {
                  if (typeof val === 'string') setStatus(val)
                }}
                items={statusOptions}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="ステータスを選択" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* アサイン・シフトガントチャート照会セクション */}
          <div id="assign" className="border-t pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">担当作業者のアサイン</h3>
                <p className="text-xs text-muted-foreground">
                  周辺パートナーのシフト稼働枠および当日の既存現場スケジュールを可視化します。
                </p>
              </div>
              {assignedWorker ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    <UserCheck className="h-3.5 w-3.5" />
                    担当: {assignedWorker.name}
                  </span>

                  {/* 確定担当者の拠点から現場へのGoogleマップ道順リンク */}
                  {assignedWorkerCoords && currentAddress && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${assignedWorkerCoords.lat},${assignedWorkerCoords.lng}&destination=${encodeURIComponent(currentAddress)}&travelmode=driving`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({ variant: 'outline', size: 'xs', className: 'gap-1 text-xs' })}
                    >
                      <Navigation className="h-3 w-3 text-primary" />
                      詳細道順
                    </a>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={handleClearAssignment}
                    className="text-muted-foreground hover:text-destructive gap-1"
                  >
                    <UserX className="h-3.5 w-3.5" />
                    解除
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 font-medium">
                  未割り当て
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-muted/20 p-3 rounded-lg border">
              <div className="space-y-1.5 md:col-span-1">
                <Label htmlFor="target_date" className="text-xs">
                  アサイン希望日
                </Label>
                <Input
                  id="target_date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="md:col-span-2 text-xs text-muted-foreground pb-2">
                ※希望日を変更すると、該当日に稼働可能な周辺パートナーのタイムラインを照会できます。
              </div>
            </div>

            <SlotAssigner
              targetDate={targetDate}
              locationAddress={currentAddress}
              selectedWorkerId={assignedWorker?.id}
              onSelectSlot={handleSelectPartner}
            />
          </div>

          {/* スケジュール期間 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-5">
            <div className="space-y-2">
              <Label htmlFor="scheduled_start_at">開始予定日時</Label>
              <Input
                id="scheduled_start_at"
                name="scheduled_start_at"
                type="datetime-local"
                value={scheduledStartAt}
                onChange={(e) => setScheduledStartAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_end_at">完了予定日時</Label>
              <Input
                id="scheduled_end_at"
                name="scheduled_end_at"
                type="datetime-local"
                value={scheduledEndAt}
                onChange={(e) => setScheduledEndAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">詳細 / 備考</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={project.description ?? ''}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link
              href="/operator/projects"
              className={buttonVariants({ variant: 'outline' })}
            >
              戻る
            </Link>
            <Button type="submit" disabled={isPending}>
              {isPending ? '更新中...' : 'アサイン・案件情報を更新'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}