import { z } from 'zod'
import { parsePhoneNumberFromString, isPossiblePhoneNumber } from 'libphonenumber-js'
import isEmail from 'validator/lib/isEmail'
import normalizeEmail from 'validator/lib/normalizeEmail'

/**
 * 電話番号スキーマ（国内番号対応）
 * - ハイフンあり/なし両対応
 * - DB保存時はハイフンなしの半角数字列に正規化（例: "09012345678"）
 * - 任意項目のため空文字は許容
 */
export const phoneSchema = z
  .string()
  .transform((val) => val.trim())
  .refine(
    (val) => !val || isPossiblePhoneNumber(val, 'JP'),
    { message: '有効な電話番号を入力してください（例: 09012345678 / 090-1234-5678）' }
  )
  .transform((val) => {
    if (!val) return null
    const parsed = parsePhoneNumberFromString(val, 'JP')
    return parsed ? parsed.formatNational().replace(/\D/g, '') : val
  })
  .optional()

/**
 * メールアドレススキーマ
 * - トリム・小文字化（LowerCase）
 * - RFC準拠のメール妥当性チェック
 * - 任意項目のため空文字は許容
 */
export const emailSchema = z
  .string()
  .transform((val) => val.trim())
  .refine(
    (val) => !val || isEmail(val),
    { message: '正しいメールアドレス形式で入力してください' }
  )
  .transform((val) => {
    if (!val) return null
    const normalized = normalizeEmail(val, { gmail_remove_dots: false })
    return normalized || val.toLowerCase()
  })
  .optional()