import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { ExternalLink, type LucideIcon } from 'lucide-react'

type LauncherCardProps = {
  id: string
  title: string
  description: string
  icon: LucideIcon
  href?: string
  disabled?: boolean
}

export function LauncherCard({
  title,
  description,
  icon: Icon,
  href,
  disabled = false,
}: LauncherCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <div className="bg-primary/10 p-2 rounded-lg text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {disabled || !href ? (
          <span
            className={buttonVariants({
              variant: 'secondary',
              className: 'w-full pointer-events-none opacity-50',
            })}
          >
            準備中
          </span>
        ) : (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              variant: 'secondary',
              className: 'w-full gap-1.5',
            })}
          >
            <ExternalLink className="h-4 w-4" />
            起動する
          </a>
        )}
      </CardContent>
    </Card>
  )
}