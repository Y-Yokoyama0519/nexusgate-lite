import { z } from 'zod'

export type ActionState = {
  errors?: {
    [key: string]: string[] | undefined
    general?: string[]
  }
  message?: string
  fields?: Record<string, string>
}

export function extractZodErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const fieldName = issue.path[0]?.toString()
    if (fieldName) {
      if (!fieldErrors[fieldName]) {
        fieldErrors[fieldName] = []
      }
      fieldErrors[fieldName].push(issue.message)
    }
  }
  return fieldErrors
}