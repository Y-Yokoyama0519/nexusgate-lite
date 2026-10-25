'use client'

import { useState, useTransition, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { savePartnerShifts } from '@/app/(apps)/operator/partners/actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { type ShiftRecord, type ShiftRowInput } from '../../schema'

interface PartnerShiftTableProps {
  partnerId: string
  currentMonth: string
  nextMonth: string
  activeMonth: string
  initialShifts: ShiftRecord[]
}

const STATUS_OPTIONS = [
  { value: 'available', label: '稼働可' },
  { value: 'unavailable', label: '休日・不可' },
  { value: 'assigned', label: 'アサイン済' },
]

export function PartnerShiftTable({
  partnerId,
  currentMonth,
  nextMonth,
  activeMonth,
  initialShifts,
}: PartnerShiftTableProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [state, formAction, isPending] = useActionState(savePartnerShifts, {})

  // 対象月の日数を算出
  const [yearStr, monthStr] = activeMonth.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const totalDays = new Date(year, month, 0).getDate()

  // 1日〜末日までの初期行データを組み立て
  const shiftMap = new Map<string, ShiftRecord>()
  initialShifts.forEach((s) => shiftMap.set(s.date, s))

  const initialRows: ShiftRowInput[] = Array.from({ length: totalDays }, (_, i) => {
    const day = i + 1
    const dateStr = `${activeMonth}-${String(day).padStart(2, '0')}`
    const existing = shiftMap.get(dateStr)

    return {
      date: dateStr,
      status: (existing?.status as ShiftRowInput['status']) ?? 'unavailable',
      start_time: existing?.start_time ? existing.start_time.slice(0, 5) : '09:00',
      end_time: existing?.end_time ? existing.end_time.slice(0, 5) : '18:00',
    }
  })

  const [rows, setRows] = useState<ShiftRowInput[]>(initialRows)

  const handleMonthChange = (newMonth: string) => {
    startTransition(() => {
      router.push(`?month=${newMonth}`)
    })
  }

  const updateRow = (index: number, updates: Partial<ShiftRowInput>) => {
    setRows((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...updates }
      return next
    })
  }

  // 平日（月〜金）一括稼働可能フィル
  const handleFillWeekdays = () => {
    setRows((prev) =>
      prev.map((row) => {
        const d = new Date(row.date)
        const dayOfWeek = d.getDay()
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          return {
            ...row,
            status: 'available',
            start_time: '09:00',
            end_time: '18:00',
          }
        }
        return row
      })
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>シフト予定管理</CardTitle>
          <CardDescription>
            月単位で日別の稼働可能枠を登録・変更します（次月まで設定可能）。
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFillWeekdays}
          >
            平日を一括「稼働可」
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 月切り替えナビゲーション */}
        <div className="flex items-center justify-between bg-muted/40 p-2.5 rounded-lg border">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={activeMonth === currentMonth}
              onClick={() => handleMonthChange(currentMonth)}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              当月 ({currentMonth})
            </Button>
            <span className="font-semibold px-2">{activeMonth}</span>
            <Button
              variant="ghost"
              size="sm"
              disabled={activeMonth === nextMonth}
              onClick={() => handleMonthChange(nextMonth)}
              className="gap-1"
            >
              次月 ({nextMonth})
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">
            ※次月までのシフトを前もって登録できます
          </span>
        </div>

        {state?.message && (
          <Alert className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Check className="h-4 w-4" />
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="partner_id" value={partnerId} />
          <input type="hidden" name="target_month" value={activeMonth} />
          <input type="hidden" name="shifts_json" value={JSON.stringify(rows)} />

          <div className="border rounded-md max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[120px]">日付</TableHead>
                  <TableHead className="w-[140px]">ステータス</TableHead>
                  <TableHead>開始時刻</TableHead>
                  <TableHead>終了時刻</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, idx) => {
                  const d = new Date(row.date)
                  const dayOfWeek = d.getDay()
                  const isSunday = dayOfWeek === 0
                  const isSaturday = dayOfWeek === 6
                  const dayLabel = ['日', '月', '火', '水', '木', '金', '土'][dayOfWeek]

                  const isWorking = row.status === 'available' || row.status === 'assigned'

                  return (
                    <TableRow key={row.date}>
                      <TableCell
                        className={`font-medium ${
                          isSunday
                            ? 'text-destructive font-semibold'
                            : isSaturday
                            ? 'text-blue-600 font-semibold'
                            : ''
                        }`}
                      >
                        {row.date.slice(8)}日 ({dayLabel})
                      </TableCell>

                      <TableCell>
                        <Select
                          value={row.status}
                          onValueChange={(val) => {
                            if (val) updateRow(idx, { status: val as ShiftRowInput['status'] })
                          }}
                          items={STATUS_OPTIONS}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell>
                        <Input
                          type="time"
                          value={row.start_time ?? ''}
                          disabled={!isWorking}
                          onChange={(e) => updateRow(idx, { start_time: e.target.value })}
                          className="h-8 max-w-[130px] text-xs"
                        />
                      </TableCell>

                      <TableCell>
                        <Input
                          type="time"
                          value={row.end_time ?? ''}
                          disabled={!isWorking}
                          onChange={(e) => updateRow(idx, { end_time: e.target.value })}
                          className="h-8 max-w-[130px] text-xs"
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'シフト保存中...' : `${activeMonth} のシフトを保存`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}