import { z } from 'zod'

export interface ParseResult<T> {
  successRows: T[]
  errorRows: Array<{ rowNumber: number; reason: string; raw: string }>
}

export function parseCsvWithSchema<T>(
  csvContent: string,
  schema: z.ZodSchema<T>,
  headerMapping: Record<string, string>
): ParseResult<T> {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length <= 1) {
    return { successRows: [], errorRows: [] }
  }

  const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim())
  const successRows: T[] = []
  const errorRows: Array<{ rowNumber: number; reason: string; raw: string }> = []

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i]
    const values = rawLine.split(',').map((v) => v.replace(/^"|"$/g, '').trim())
    const rowObj: Record<string, unknown> = {}

    headers.forEach((header, idx) => {
      const fieldKey = headerMapping[header] || header
      rowObj[fieldKey] = values[idx] ?? null
    })

    const parsed = schema.safeParse(rowObj)
    if (parsed.success) {
      successRows.push(parsed.data)
    } else {
      errorRows.push({
        rowNumber: i + 1,
        reason: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', '),
        raw: rawLine,
      })
    }
  }

  return { successRows, errorRows }
}