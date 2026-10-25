import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { RefreshButton } from '@/components/common/refresh-button'
import { PartnersTable } from './_components/partners-table'
import { type PartnerItem } from './schema'

export default async function PartnersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: partners, error } = await supabase
    .from('partner_workers')
    .select('id, name, phone, email, home_address, base_address, created_at, updated_at, company_id, user_id')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching partner workers:', error.message)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">パートナー管理</h1>
          <p className="text-sm text-muted-foreground">
            委託先・協力会社マスタの閲覧・新規登録・シフト管理
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton />
          <Link
            href="/operator/partners/new"
            className={buttonVariants({ className: 'gap-1.5' })}
          >
            <Plus className="h-4 w-4" />
            新規パートナー登録
          </Link>
        </div>
      </div>

      <PartnersTable partners={(partners as PartnerItem[]) ?? []} />
    </div>
  )
}