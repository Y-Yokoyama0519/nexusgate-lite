'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-md w-full shadow-lg border-destructive/30">
        <CardHeader className="text-center">
          <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-2 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">セッションまたは通信のエラー</CardTitle>
          <CardDescription>
            通信が中断されたか、認証セッションが無効になった可能性があります。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => reset()}
            variant="default"
            className="w-full gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            画面を再読み込みする
          </Button>
          <Button
            onClick={() => {
              window.location.href = '/login'
            }}
            variant="outline"
            className="w-full"
          >
            ログイン画面に戻る
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}