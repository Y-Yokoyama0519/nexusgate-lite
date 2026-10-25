'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  // 1. フォームから送信された値を取得
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 2. Supabaseクライアントの初期化
  const supabase = await createClient()

  // 3. Supabaseの認証APIを叩く
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  // 4. エラーハンドリング
if (error) {
    console.error('❌ Supabase Auth Error:', error.message, error.status) // 👈 詳細を出力
    redirect('/login?error=auth_failed')
  }

  // 5. 成功時の処理（launcherへリダイレクト）
  redirect('/launcher')
}