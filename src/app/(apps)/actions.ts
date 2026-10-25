'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function logout() {
  const supabase = await createClient()

  // 1. Supabaseサーバー側でセッションを破棄し、ローカルのCookieをクリア
  await supabase.auth.signOut()

  // 2. ログイン画面へリダイレクト
  redirect('/login')
}