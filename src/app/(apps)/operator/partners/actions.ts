'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { type ActionState, extractZodErrors } from '@/lib/actions/utils'
import {
  CreatePartnerSchema,
  UpdatePartnerSchema,
  SavePartnerShiftsSchema,
  type ShiftRowInput,
} from './schema'
import { geocodeAddress, toPostGisPoint } from '@/lib/geo/address'

export async function createPartner(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rawFields: Record<string, string> = {
    name: (formData.get('name') as string) ?? '',
    phone: (formData.get('phone') as string) ?? '',
    email: (formData.get('email') as string) ?? '',
    home_postal_code: (formData.get('home_postal_code') as string) ?? '',
    home_address: (formData.get('home_address') as string) ?? '',
    home_address2: (formData.get('home_address2') as string) ?? '',
    base_postal_code: (formData.get('base_postal_code') as string) ?? '',
    base_address: (formData.get('base_address') as string) ?? '',
    base_address2: (formData.get('base_address2') as string) ?? '',
  }

  const validated = CreatePartnerSchema.safeParse(rawFields)
  if (!validated.success) {
    return {
      errors: extractZodErrors(validated.error),
      message: '入力内容に不備があります。確認してください。',
      fields: rawFields,
    }
  }

  const data = validated.data

  // 出発拠点（base_address）のジオコーディング
  let baseLocationPoint: string | null = null
  let baseGeocodeLevel: number | null = null

  if (data.base_address?.trim()) {
    const geo = await geocodeAddress(data.base_address.trim())
    if (geo) {
      baseLocationPoint = toPostGisPoint(geo)
      baseGeocodeLevel = geo.level
    }
  }

  const { error } = await supabase.from('partner_workers').insert({
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    home_postal_code: data.home_postal_code || null,
    home_address: data.home_address || null,
    home_address2: data.home_address2 || null,
    base_postal_code: data.base_postal_code || null,
    base_address: data.base_address || null,
    base_address2: data.base_address2 || null,
    base_location: baseLocationPoint,
    base_geocode_level: baseGeocodeLevel,
  })

  if (error) {
    console.error('Partner worker insert error:', error.message)
    return {
      errors: {
        general: ['パートナーの登録に失敗しました。管理者にお問い合わせください。'],
      },
      fields: rawFields,
    }
  }

  revalidatePath('/operator/partners')
  redirect('/operator/partners')
}

export async function updatePartner(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rawFields: Record<string, string> = {
    id: (formData.get('id') as string) ?? '',
    name: (formData.get('name') as string) ?? '',
    phone: (formData.get('phone') as string) ?? '',
    email: (formData.get('email') as string) ?? '',
    home_postal_code: (formData.get('home_postal_code') as string) ?? '',
    home_address: (formData.get('home_address') as string) ?? '',
    home_address2: (formData.get('home_address2') as string) ?? '',
    base_postal_code: (formData.get('base_postal_code') as string) ?? '',
    base_address: (formData.get('base_address') as string) ?? '',
    base_address2: (formData.get('base_address2') as string) ?? '',
  }

  const validated = UpdatePartnerSchema.safeParse(rawFields)
  if (!validated.success) {
    return {
      errors: extractZodErrors(validated.error),
      message: '入力内容に不備があります。確認してください。',
      fields: rawFields,
    }
  }

  const data = validated.data

  let baseLocationPoint: string | null = null
  let baseGeocodeLevel: number | null = null

  if (data.base_address?.trim()) {
    const geo = await geocodeAddress(data.base_address.trim())
    if (geo) {
      baseLocationPoint = toPostGisPoint(geo)
      baseGeocodeLevel = geo.level
    }
  }

  const { error } = await supabase
    .from('partner_workers')
    .update({
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      home_postal_code: data.home_postal_code || null,
      home_address: data.home_address || null,
      home_address2: data.home_address2 || null,
      base_postal_code: data.base_postal_code || null,
      base_address: data.base_address || null,
      base_address2: data.base_address2 || null,
      base_location: baseLocationPoint,
      base_geocode_level: baseGeocodeLevel,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.id)

  if (error) {
    console.error('Partner worker update error:', error.message)
    return {
      errors: {
        general: ['パートナー情報の更新に失敗しました。管理者にお問い合わせください。'],
      },
      fields: rawFields,
    }
  }

  revalidatePath(`/operator/partners/${data.id}`)
  revalidatePath('/operator/partners')
  return { message: '基本情報を更新しました。' }
}

export async function savePartnerShifts(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const worker_id = formData.get('partner_id') as string
  const target_month = formData.get('target_month') as string
  const shiftsJson = formData.get('shifts_json') as string

  let shifts: ShiftRowInput[] = []
  try {
    shifts = JSON.parse(shiftsJson)
  } catch {
    return { errors: { general: ['シフト形式が不正です'] } }
  }

  const validated = SavePartnerShiftsSchema.safeParse({
    worker_id,
    target_month,
    shifts,
  })

  if (!validated.success) {
    return {
      errors: extractZodErrors(validated.error),
      message: '入力内容に不備があります。確認してください。',
    }
  }

  const [yearStr, monthStr] = target_month.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const startDate = `${target_month}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${target_month}-${String(lastDay).padStart(2, '0')}`

  const { error: deleteError } = await supabase
    .from('partner_shifts')
    .delete()
    .eq('worker_id', worker_id)
    .gte('date', startDate)
    .lte('date', endDate)

  if (deleteError) {
    console.error('Delete shifts error:', deleteError.message)
    return { errors: { general: ['既存シフトの初期化に失敗しました。'] } }
  }

  if (shifts.length > 0) {
    const recordsToInsert = shifts.map((s) => ({
      worker_id,
      date: s.date,
      start_time: s.start_time || '09:00',
      end_time: s.end_time || '18:00',
      status: s.status,
    }))

    const { error: insertError } = await supabase
      .from('partner_shifts')
      .insert(recordsToInsert)

    if (insertError) {
      console.error('Insert shifts error:', insertError.message)
      return { errors: { general: ['シフトの保存に失敗しました。'] } }
    }
  }

  revalidatePath(`/operator/partners/${worker_id}`)
  return { message: `${target_month} のシフトを保存しました。` }
}