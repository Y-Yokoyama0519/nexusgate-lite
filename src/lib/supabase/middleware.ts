import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // 1. リクエストのヘッダー情報を引き継いで、初期レスポンスを作成
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 2. Supabaseクライアントの初期化とCookieの管理
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // トークンリフレッシュ等でCookieの更新が必要な場合の処理
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. ユーザーの認証状態をサーバーで検証（error を受け取るよう変更）
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // =========================================================================
  // ルーティング制御（ホワイトリスト方式・ビジネスロジック層）
  // =========================================================================
  const currentPath = request.nextUrl.pathname

  // 📝 認証不要でアクセスを許可するパスのリスト（拡張時はここに改行して追加）
  const publicRoutes = [
    '/login',
    '/test-login', //検証完了後に /test-login を削除
    // '/api/webhook/stripe', // 例: 外部連携用のAPIルート
  ]

  // 現在のパスが publicRoutes のいずれかに前方一致するかチェック
  const isPublicRoute = publicRoutes.some((route) => currentPath.startsWith(route))

  // 4. 【追加】無効なリフレッシュトークン等の認証エラーが発生した場合の自動クリーンアップ
  if (error && !isPublicRoute) {
    request.cookies.getAll().forEach((cookie) => {
      if (cookie.name.startsWith('sb-')) {
        supabaseResponse.cookies.delete(cookie.name)
      }
    })
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url, {
      headers: supabaseResponse.headers,
    })
  }

  // 未認証ユーザーが保護されたルートにアクセスした場合
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 既にログイン済みのユーザーがログイン画面にアクセスした場合
  if (user && currentPath === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/launcher' // 業務システムのトップへリダイレクト
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}