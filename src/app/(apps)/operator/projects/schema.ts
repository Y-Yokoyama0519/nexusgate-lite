import { z } from 'zod'

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const ProjectBaseSchema = z.object({
  customer_id: z
    .string()
    .min(1, { message: '対象の顧客を選択してください' })
    .regex(UUID_REGEX, { message: '有効な顧客IDを選択してください' }),
  title: z.string().min(1, { message: '案件名は必須です' }),
  postal_code: z.string().optional(),
  address: z.string().optional(),
  address2: z.string().optional(),
  assigned_worker_id: z
    .string()
    .regex(UUID_REGEX, { message: '有効な作業者IDを指定してください' })
    .optional()
    .or(z.literal('')),
  description: z.string().optional(),
  status: z
    .enum([
      'draft',
      'pending_assignment',
      'assigned',
      'in_progress',
      'completed',
      'cancelled',
    ])
    .default('draft'),
  scheduled_start_at: z.string().optional(),
  scheduled_end_at: z.string().optional(),
})

export function validateProjectSchedule(
  data: {
    status?: string
    scheduled_start_at?: string
    scheduled_end_at?: string
  },
  ctx: z.RefinementCtx
) {
  const isDraft = data.status === 'draft'

  if (!isDraft) {
    if (!data.scheduled_start_at) {
      ctx.addIssue({
        code: 'custom',
        message: '下書き以外のステータスでは開始予定日時が必須です',
        path: ['scheduled_start_at'],
      })
    }
    if (!data.scheduled_end_at) {
      ctx.addIssue({
        code: 'custom',
        message: '下書き以外のステータスでは完了予定日時が必須です',
        path: ['scheduled_end_at'],
      })
    }
  }

  if (data.scheduled_start_at && data.scheduled_end_at) {
    const start = new Date(data.scheduled_start_at).getTime()
    const end = new Date(data.scheduled_end_at).getTime()

    if (isNaN(start)) {
      ctx.addIssue({
        code: 'custom',
        message: '無効な開始日時です',
        path: ['scheduled_start_at'],
      })
    }
    if (!isNaN(end) && end < start) {
      ctx.addIssue({
        code: 'custom',
        message: '完了予定日時は開始予定日時以降を指定してください',
        path: ['scheduled_end_at'],
      })
    }
  }
}

export const CreateProjectSchema = ProjectBaseSchema.superRefine(validateProjectSchedule)

export const UpdateProjectSchema = ProjectBaseSchema.extend({
  id: z.string().regex(UUID_REGEX, { message: '有効な案件IDを指定してください' }),
}).superRefine(validateProjectSchedule)

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>

export interface ProjectEditData {
  id: string
  customer_id: string
  title: string
  postal_code?: string | null
  address?: string | null
  address2?: string | null
  assigned_worker_id?: string | null
  description: string | null
  status: string
  scheduled_start_at: string | null
  scheduled_end_at: string | null
  partner_workers?: {
    id: string
    name: string
  } | null
}

export interface ProjectItem {
  id: string
  title: string
  status: string
  scheduled_start_at: string | null
  scheduled_end_at: string | null
  address?: string | null
  address2?: string | null
  customers?: {
    id: string
    name: string
  } | null
  partner_workers?: {
    id: string
    name: string
  } | null
}

export interface ScheduleBlock {
  id: string
  title: string
  locationAddress: string | null
  displayArea: string
  startMinutes: number
  endMinutes: number
  startTimeStr: string
  endTimeStr: string
}

export interface PartnerTimelineCandidate {
  workerId: string
  workerName: string
  baseAddress: string | null
  distanceKm: number
  shiftStart: string
  shiftEnd: string
  shiftStartMinutes: number
  shiftEndMinutes: number
  blocks: ScheduleBlock[]
}