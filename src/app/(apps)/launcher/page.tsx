import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ShieldAlert, LogOut } from 'lucide-react'
import { logout } from '@/app/(apps)/actions'
import { APPS } from '@/config/apps'
import { LAUNCHER_CATEGORIES } from './_config/categories'
import { LauncherCard } from './_components/launcher-card'

export default async function LauncherPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role || 'unknown'

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-8">
      <header className="flex items-center justify-between border-b pb-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">NexusGate Launcher</h1>
          <p className="text-muted-foreground">
            ようこそ。アクセスするシステムを選択してください。
          </p>
        </div>
        <form action={logout}>
          <Button
            variant="outline"
            size="sm"
            type="submit"
            className="gap-2 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            ログアウト
          </Button>
        </form>
      </header>

      <Alert variant={role === 'unknown' ? 'destructive' : 'default'}>
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>権限ステータス確認</AlertTitle>
        <AlertDescription>
          現在のアカウントID:{' '}
          <code className="bg-muted px-1 py-0.5 rounded text-xs">{user.id}</code>
          <br />
          現在の付与ロール: <strong className="text-primary">{role}</strong>
        </AlertDescription>
      </Alert>

      <div className="space-y-8">
        {LAUNCHER_CATEGORIES.map((cat) => (
          <section key={cat.category} className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {cat.category}
              </h2>
              <p className="text-xs text-muted-foreground">{cat.description}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {cat.appIds.map((id) => {
                const app = APPS[id]
                if (!app) return null

                return (
                  <LauncherCard
                    key={app.id}
                    id={app.id}
                    title={app.title}
                    description={app.description}
                    icon={app.icon}
                    href={app.href}
                    disabled={app.disabled}
                  />
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}