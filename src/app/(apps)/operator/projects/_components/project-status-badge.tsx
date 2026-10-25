export type ProjectStatus =
  | 'draft'
  | 'pending_assignment'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

const STATUS_CONFIG: Record<
  ProjectStatus | string,
  { label: string; className: string }
> = {
  draft: {
    label: "下書き",
    className: "bg-muted text-muted-foreground border-border",
  },
  pending_assignment: {
    label: "アサイン待ち",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  },
  assigned: {
    label: "アサイン済",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  },
  in_progress: {
    label: "進行中",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  },
  completed: {
    label: "完了",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  cancelled: {
    label: "中止",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
}

export function ProjectStatusBadge({ status }: { status: string }) {
  const meta = STATUS_CONFIG[status] || {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.className}`}
    >
      {meta.label}
    </span>
  )
}