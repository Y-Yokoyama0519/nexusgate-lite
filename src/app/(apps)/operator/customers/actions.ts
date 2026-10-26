'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { type ActionState, extractZodErrors } from '@/lib/actions/utils'
import { CreateCustomerSchema, UpdateCustomerSchema } from './schema'
import { resolveAddressLocation } from '@/lib/geo/address'

export async function saveCustomer(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const rawId = formData.get('id') as string | null
  const isEdit = !!rawId && rawId.trim() !== ''

  const rawFields: Record<string, unknown> = {
    customer_code: formData.get('customer_code') ?? '',
    name: formData.get('name') ?? '',
    name_kana: formData.get('name_kana') ?? '',
    branch_name: formData.get('branch_name') ?? '',
    contact_name: formData.get('contact_name') ?? '',
    email: formData.get('email') ?? '',
    phone: formData.get('phone') ?? '',
    postal_code: formData.get('postal_code') ?? '',
    address: formData.get('address') ?? '',
    address2: formData.get('address2') ?? '',
    notes: formData.get('notes') ?? '',
    is_active: isEdit ? formData.get('is_active') === 'true' : true,
  }

  if (isEdit) {
    rawFields.id = rawId!
  }

  const validated = isEdit
    ? UpdateCustomerSchema.safeParse(rawFields)
    : CreateCustomerSchema.safeParse(rawFields)

  if (!validated.success) {
    return {
      errors: extractZodErrors(validated.error),
      message: '入力内容に不備があります。確認してください。',
      fields: Object.fromEntries(
        Object.entries(rawFields).map(([k, v]) => [k, String(v ?? '')])
      ),
    }
  }

  const data = validated.data

  let currentCustomer = null
  if (isEdit) {
    const { data: existing } = await supabase
      .from('customers')
      .select('address, location, geocode_level')
      .eq('id', rawId)
      .single()
    currentCustomer = existing
  }

  const { locationPoint, geocodeLevel } = await resolveAddressLocation({
    newAddress: data.address,
    currentAddress: currentCustomer?.address,
    currentLocation: currentCustomer?.location,
    currentGeocodeLevel: currentCustomer?.geocode_level,
  })

  const payload = {
    customer_code: data.customer_code,
    name: data.name,
    name_kana: data.name_kana || null,
    branch_name: data.branch_name || null,
    contact_name: data.contact_name || null,
    email: data.email || null,
    phone: data.phone || null,
    postal_code: data.postal_code || null,
    address: data.address || null,
    address2: data.address2 || null,
    location: locationPoint,
    geocode_level: geocodeLevel,
    notes: data.notes || null,
    is_active: data.is_active,
    updated_at: new Date().toISOString(),
  }

  if (isEdit) {
    const { error } = await supabase
      .from('customers')
      .update(payload)
      .eq('id', rawId)

    if (error) {
      console.error('Customer update error:', error.message)
      const isUniqueError = error.code === '23505'
      return {
        errors: {
          general: [
            isUniqueError
              ? '指定された顧客コードは既に使用されています。'
              : '顧客情報の更新に失敗しました。',
          ],
        },
      }
    }
  } else {
    const { error } = await supabase.from('customers').insert(payload)

    if (error) {
      console.error('Customer insert error:', error.message)
      const isUniqueError = error.code === '23505'
      return {
        errors: {
          general: [
            isUniqueError
              ? '指定された顧客コードは既に使用されています。'
              : '顧客の登録に失敗しました。',
          ],
        },
      }
    }
  }

  revalidatePath('/operator/customers')
  if (isEdit) {
    revalidatePath(`/operator/customers/${rawId}`)
  }
  redirect('/operator/customers')
}