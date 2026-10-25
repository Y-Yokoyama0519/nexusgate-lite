import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type Database } from '@/types/database.types'

export async function createClient() {
  // Next.js 15以降の仕様に合わせ、cookies() を非同期で取得します
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            // サーバー側でCookie（ログイン状態）を安全に書き込みます
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Componentから呼び出された場合の例外キャッチ用（フェイルセーフ）
          }
        },
      },
    }
  )
}