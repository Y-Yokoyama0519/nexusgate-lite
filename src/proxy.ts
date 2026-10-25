import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export default async function proxy(request: NextRequest) {
  // 分離した認証・ルーティングロジックを実行
  return await updateSession(request)
}

// =========================================================================
// Matcher（インフラ層の除外設定）
// =========================================================================
export const config = {
  /*
   * 以下の静的ファイルやアセットへのリクエストにはProxy(Middleware)を実行しない
   * 1. _next/static (Next.jsのビルド済みアセット)
   * 2. _next/image (画像最適化API)
   * 3. favicon.ico, sitemap.xml, robots.txt (メタデータ)
   * 4. .*\.(?:svg|png|jpg|jpeg|gif|webp)$ (静的画像ファイル)
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}