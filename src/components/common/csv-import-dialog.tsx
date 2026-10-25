'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { UploadCloud, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'

interface CsvImportDialogProps {
  title: string
  description: string
  onImport: (fileContent: string) => Promise<{ successCount: number; errorCount: number; errors: string[] }>
  onSuccess?: () => void
}

export function CsvImportDialog({ title, description, onImport, onSuccess }: CsvImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [result, setResult] = useState<{ successCount: number; errorCount: number; errors: string[] } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      setFileContent(event.target?.result as string)
    }
    reader.readAsText(file, 'utf-8')
  }

  const handleExecuteImport = () => {
    if (!fileContent) return

    startTransition(async () => {
      const res = await onImport(fileContent)
      setResult(res)
      if (res.successCount > 0 && res.errorCount === 0) {
        onSuccess?.()
      }
    })
  }

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="gap-1.5">
        <UploadCloud className="h-4 w-4" />
        CSV一括登録
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-w-lg w-full p-6 space-y-4 bg-background">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>

        <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-2">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-primary file:text-primary-foreground"
          />
          {fileName && <p className="text-xs text-muted-foreground mt-2">選択ファイル: {fileName}</p>}
        </div>

        {result && (
          <div className="text-xs space-y-1.5 max-h-40 overflow-y-auto p-3 bg-muted rounded">
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <CheckCircle2 className="h-4 w-4" /> 登録成功: {result.successCount} 件
            </div>
            {result.errorCount > 0 && (
              <div className="text-destructive font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> スキップされた不正行: {result.errorCount} 件
              </div>
            )}
            {result.errors.map((err, i) => (
              <p key={i} className="text-destructive font-mono text-[11px]">{err}</p>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} disabled={isPending}>
            閉じる
          </Button>
          <Button
            size="sm"
            onClick={handleExecuteImport}
            disabled={!fileContent || isPending}
            className="gap-1.5"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            取り込み開始
          </Button>
        </div>
      </Card>
    </div>
  )
}