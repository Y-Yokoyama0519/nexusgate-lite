import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck, ArrowRight } from 'lucide-react'

export default async function TestLoginPage() {
  async function handleSuperAdminLogin() {
    'use server'
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: 'admin_super@nexusgate.local',
      password: 'password123',
    })

    if (error) {
      console.error('Super admin login failed:', error.message)
      redirect('/test-login?error=failed')
    }

    redirect('/launcher')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-md border-primary/30 shadow-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">技術評価用 デモログイン</CardTitle>
          <CardDescription>
            ポートフォリオ検証用アカウント（admin_super）で即座にセッションを開始します。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={handleSuperAdminLogin}>
            <Button type="submit" className="w-full h-11 gap-2 text-sm font-semibold">
              スーパー管理者として開始する
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="text-[11px] text-muted-foreground text-center space-y-1 border-t pt-3">
            <div>アカウント: <code>admin_super@nexusgate.local</code></div>
            <div>全オペレーション業務（顧客・パートナー・案件アサイン）の検証が可能です</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}