import { z } from 'zod'
import { phoneSchema, emailSchema } from '@/lib/validations/common'
import { type Database } from '@/types/database.types'

export const CustomerBaseSchema = z.object({
  customer_code: z
    .string()
    .trim()
    .min(1, { message: '顧客コードは必須です' })
    .transform((val) => val.toUpperCase())
    .pipe(
      z
        .string()
        .min(2, { message: '顧客コードは2文字以上の半角英数字で指定してください' })
        .max(20, { message: '顧客コードは20文字以内で指定してください' })
        .regex(/^[A-Z0-9]+$/, { message: '顧客コードは半角英数字のみ使用可能です' })
    ),
  name: z.string().trim().min(1, { message: '顧客名（会社名）は必須です' }),
  name_kana: z.string().trim().optional(),
  branch_name: z.string().trim().optional(),
  contact_name: z.string().trim().optional(),
  email: emailSchema,
  phone: phoneSchema,
  postal_code: z.string().trim().optional(),
  address: z.string().trim().optional(),
  address2: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  is_active: z.coerce.boolean().default(true),
})

export const CreateCustomerSchema = CustomerBaseSchema

export const UpdateCustomerSchema = CustomerBaseSchema.extend({
  id: z.string().uuid({ message: '有効な顧客IDを指定してください' }),
})

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>
export type CustomerItem = Database['public']['Tables']['customers']['Row']