import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CustomerForm } from '../_components/customer-form'
import { buttonVariants } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { type CustomerItem } from '../schema'

export const metadata = {
  title: '顧客詳細・編集',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !customer) {
    notFound()
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/operator/customers"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          一覧へ戻る
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">顧客詳細・編集</h1>
        <p className="text-sm text-muted-foreground mt-1">
          取引先の基本情報や連絡先の確認・編集を行います。
        </p>
      </div>

      <CustomerForm initialData={customer as CustomerItem} />
    </div>
  )
}