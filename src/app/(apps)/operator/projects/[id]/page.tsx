import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProjectEditForm } from './_components/project-edit-form'
import { buttonVariants } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { type ProjectEditData } from '../schema'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 案件情報（顧客情報および担当作業者を含む）と、顧客選択肢一覧を並行取得
  const [projectRes, customersRes] = await Promise.all([
    supabase
      .from('projects')
      .select('*, customers(id, name), partner_workers(id, name)')
      .eq('id', id)
      .single(),
    supabase.from('customers').select('id, name').order('name'),
  ])

  if (projectRes.error || !projectRes.data) {
    notFound()
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/operator/projects"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          一覧へ戻る
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">案件詳細・編集</h1>
        <p className="text-sm text-muted-foreground mt-1">
          登録された案件のステータス変更、空き枠照会によるアサイン確定、詳細情報の編集を行います。
        </p>
      </div>

      <ProjectEditForm
        project={projectRes.data as unknown as ProjectEditData}
        customers={customersRes.data ?? []}
      />
    </div>
  )
}