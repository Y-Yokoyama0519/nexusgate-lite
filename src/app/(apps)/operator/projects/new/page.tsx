import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProjectForm } from './_components/project-form'

export const metadata = {
  title: '新規案件登録 | NexusGate',
}

export default async function NewProjectPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, address')
    .order('name', { ascending: true })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <ProjectForm customers={customers || []} />
    </div>
  )
}