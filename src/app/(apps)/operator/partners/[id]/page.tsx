import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { PartnerEditForm } from './_components/partner-edit-form'
import { PartnerShiftTable } from './_components/partner-shift-table'
import { type ShiftRecord } from '../schema'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ month?: string }>
}

function getMonthStrings() {
  const now = new Date()
  const curY = now.getFullYear()
  const curM = String(now.getMonth() + 1).padStart(2, '0')
  const currentMonth = `${curY}-${curM}`

  const nextDate = new Date(curY, now.getMonth() + 1, 1)
  const nextY = nextDate.getFullYear()
  const nextM = String(nextDate.getMonth() + 1).padStart(2, '0')
  const nextMonth = `${nextY}-${nextM}`

  return { currentMonth, nextMonth }
}

export default async function PartnerDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { month } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { currentMonth, nextMonth } = getMonthStrings()
  const activeMonth = month === nextMonth ? nextMonth : currentMonth

  const startDate = `${activeMonth}-01`
  const [yearStr, monthStr] = activeMonth.split('-')
  const lastDay = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0).getDate()
  const endDate = `${activeMonth}-${String(lastDay).padStart(2, '0')}`

  const [partnerRes, shiftsRes] = await Promise.all([
    supabase
      .from('partner_workers')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('partner_shifts')
      .select('*')
      .eq('worker_id', id)
      .gte('date', startDate)
      .lte('date', endDate),
  ])

  if (partnerRes.error || !partnerRes.data) {
    notFound()
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/operator/partners"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          一覧へ戻る
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">パートナー詳細・シフト</h1>
        <p className="text-sm text-muted-foreground mt-1">
          パートナーの基本情報更新および稼働可能シフトの管理を行います。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <PartnerEditForm partner={partnerRes.data} />
        <PartnerShiftTable
          partnerId={id}
          currentMonth={currentMonth}
          nextMonth={nextMonth}
          activeMonth={activeMonth}
          initialShifts={(shiftsRes.data as ShiftRecord[]) ?? []}
        />
      </div>
    </div>
  )
}