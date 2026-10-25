'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { type ActionState, extractZodErrors } from '@/lib/actions/utils'
import { CreateProjectSchema, UpdateProjectSchema } from './schema'
import { geocodeAddress, toPostGisPoint } from '@/lib/geo/address'

export async function createProject(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rawStart = formData.get('scheduled_start_at') as string | null
  const rawEnd = formData.get('scheduled_end_at') as string | null

  const rawFields = {
    customer_id: formData.get('customer_id'),
    title: formData.get('title'),
    postal_code: formData.get('postal_code') || undefined,
    address: formData.get('address') || undefined,
    address2: formData.get('address2') || undefined,
    description: formData.get('description') || undefined,
    status: formData.get('status') || 'draft',
    scheduled_start_at: rawStart && rawStart.trim() !== '' ? rawStart : undefined,
    scheduled_end_at: rawEnd && rawEnd.trim() !== '' ? rawEnd : undefined,
  }

  const validatedFields = CreateProjectSchema.safeParse(rawFields)

  if (!validatedFields.success) {
    return {
      errors: extractZodErrors(validatedFields.error),
      message: '入力内容に不備があります。確認してください。',
    }
  }

  const data = validatedFields.data

  // 現場住所のジオコーディング
  let locationPoint: string | null = null
  let geocodeLevel: number | null = null

  if (data.address?.trim()) {
    const geo = await geocodeAddress(data.address.trim())
    if (geo) {
      locationPoint = toPostGisPoint(geo)
      geocodeLevel = geo.level
    }
  }

  const { error } = await supabase.from('projects').insert({
    customer_id: data.customer_id,
    title: data.title,
    postal_code: data.postal_code || null,
    address: data.address || null,
    address2: data.address2 || null,
    location: locationPoint,
    geocode_level: geocodeLevel,
    description: data.description || null,
    status: data.status,
    scheduled_start_at: data.scheduled_start_at ? new Date(data.scheduled_start_at).toISOString() : null,
    scheduled_end_at: data.scheduled_end_at ? new Date(data.scheduled_end_at).toISOString() : null,
    actual_start_at: null,
    actual_end_at: null,
  })

  if (error) {
    console.error('Project insert error:', error.message)
    return {
      errors: { general: ['案件の登録に失敗しました。管理者にお問い合わせください。'] },
    }
  }

  revalidatePath('/operator/projects')
  redirect('/operator/projects')
}

export async function updateProject(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rawStart = formData.get('scheduled_start_at') as string | null
  const rawEnd = formData.get('scheduled_end_at') as string | null
  const rawWorkerId = formData.get('assigned_worker_id') as string | null

  const rawFields = {
    id: formData.get('id'),
    customer_id: formData.get('customer_id'),
    title: formData.get('title'),
    postal_code: formData.get('postal_code') || undefined,
    address: formData.get('address') || undefined,
    address2: formData.get('address2') || undefined,
    assigned_worker_id: rawWorkerId && rawWorkerId.trim() !== '' ? rawWorkerId : undefined,
    description: formData.get('description') || undefined,
    status: formData.get('status'),
    scheduled_start_at: rawStart && rawStart.trim() !== '' ? rawStart : undefined,
    scheduled_end_at: rawEnd && rawEnd.trim() !== '' ? rawEnd : undefined,
  }

  const validatedFields = UpdateProjectSchema.safeParse(rawFields)

  if (!validatedFields.success) {
    return {
      errors: extractZodErrors(validatedFields.error),
      message: '入力内容に不備があります。確認してください。',
    }
  }

  const data = validatedFields.data

  let locationPoint: string | null = null
  let geocodeLevel: number | null = null

  if (data.address?.trim()) {
    const geo = await geocodeAddress(data.address.trim())
    if (geo) {
      locationPoint = toPostGisPoint(geo)
      geocodeLevel = geo.level
    }
  }

  const { error } = await supabase
    .from('projects')
    .update({
      customer_id: data.customer_id,
      title: data.title,
      postal_code: data.postal_code || null,
      address: data.address || null,
      address2: data.address2 || null,
      location: locationPoint,
      geocode_level: geocodeLevel,
      assigned_worker_id: data.assigned_worker_id || null,
      description: data.description || null,
      status: data.status,
      scheduled_start_at: data.scheduled_start_at ? new Date(data.scheduled_start_at).toISOString() : null,
      scheduled_end_at: data.scheduled_end_at ? new Date(data.scheduled_end_at).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.id)

  if (error) {
    console.error('Project update error:', error.message)
    return {
      errors: { general: ['案件の更新に失敗しました。管理者にお問い合わせください。'] },
    }
  }

  revalidatePath('/operator/projects')
  revalidatePath(`/operator/projects/${data.id}`)
  redirect('/operator/projects')
}