import { z } from 'zod'
import { type Database } from '@/types/database.types'
import { phoneSchema, emailSchema } from '@/lib/validations/common'

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const PartnerBaseSchema = z.object({
  name: z.string().min(1, { message: '屋号 / パートナー名は必須です' }),
  company_id: z.string().regex(UUID_REGEX).optional().or(z.literal('')),
  email: emailSchema,
  phone: phoneSchema,
  home_postal_code: z.string().optional(),
  home_address: z.string().optional(),
  home_address2: z.string().optional(),
  base_postal_code: z.string().optional(),
  base_address: z.string().optional(),
  base_address2: z.string().optional(),
})

export const CreatePartnerSchema = PartnerBaseSchema

export const UpdatePartnerSchema = PartnerBaseSchema.extend({
  id: z.string().regex(UUID_REGEX, { message: '有効なIDを指定してください' }),
})

export const ShiftRowSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: '日付形式が不正です' }),
    status: z.enum(['available', 'assigned', 'unavailable']),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === 'available' || data.status === 'assigned') {
        if (!data.start_time || !data.end_time) return false
        return data.end_time > data.start_time
      }
      return true
    },
    {
      message: '稼働時は開始時刻・終了時刻を正しく指定してください',
      path: ['end_time'],
    }
  )

export const SavePartnerShiftsSchema = z.object({
  worker_id: z.string().regex(UUID_REGEX, { message: '有効なIDを指定してください' }),
  target_month: z.string().regex(/^\d{4}-\d{2}$/, { message: '対象月の形式が不正です' }),
  shifts: z.array(ShiftRowSchema),
})

export type CreatePartnerInput = z.infer<typeof CreatePartnerSchema>
export type UpdatePartnerInput = z.infer<typeof UpdatePartnerSchema>
export type ShiftRowInput = z.infer<typeof ShiftRowSchema>
export type SavePartnerShiftsInput = z.infer<typeof SavePartnerShiftsSchema>

export type PartnerItem = Database['public']['Tables']['partner_workers']['Row']
export type ShiftRecord = Database['public']['Tables']['partner_shifts']['Row']