import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UserCheck } from 'lucide-react'
import { type ProjectItem } from '../schema'

interface ProjectsTableProps {
  projects: ProjectItem[]
}

const statusMap: Record<string, string> = {
  draft: '下書き',
  pending_assignment: 'アサイン待ち',
  assigned: 'アサイン済み',
  in_progress: '進行中',
  completed: '完了',
  cancelled: 'キャンセル',
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10 text-muted-foreground text-sm">
        案件データが登録されていません。
      </div>
    )
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>案件名</TableHead>
            <TableHead>顧客名</TableHead>
            <TableHead>担当作業者</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>開始予定</TableHead>
            <TableHead>完了予定</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const isPendingAssignment =
              project.status === 'pending_assignment' ||
              (!project.partner_workers && project.status !== 'completed' && project.status !== 'cancelled')

            return (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.title}</TableCell>
                <TableCell>{project.customers?.name ?? '-'}</TableCell>
                <TableCell>
                  {project.partner_workers?.name ? (
                    <span className="font-medium text-foreground">
                      {project.partner_workers.name}
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-medium">
                      未割り当て
                    </span>
                  )}
                </TableCell>
                <TableCell>{statusMap[project.status] ?? project.status}</TableCell>
                <TableCell>{formatDate(project.scheduled_start_at)}</TableCell>
                <TableCell>{formatDate(project.scheduled_end_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {isPendingAssignment && (
                      <Link
                        href={`/operator/projects/${project.id}#assign`}
                        className={buttonVariants({ variant: 'default', size: 'sm', className: 'gap-1' })}
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        アサイン
                      </Link>
                    )}
                    <Link
                      href={`/operator/projects/${project.id}`}
                      className={buttonVariants({ variant: 'outline', size: 'sm' })}
                    >
                      編集
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}