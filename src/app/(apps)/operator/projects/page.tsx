import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { RefreshButton } from "@/components/common/refresh-button"
import { ProjectsTable } from "./_components/projects-table"
import { type ProjectItem } from "./schema"

export default async function ProjectsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: projects, error } = await supabase
    .from("projects")
    .select(`
      id,
      title,
      status,
      scheduled_start_at,
      scheduled_end_at,
      address,
      address2,
      created_at,
      customers ( id, name ),
      partner_workers ( id, name )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching projects:", error.message)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">案件管理</h1>
          <p className="text-sm text-muted-foreground">
            進行中プロジェクトの管理・アサイン状況の確認
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton />
          <Link
            href="/operator/projects/new"
            className={buttonVariants({ className: "gap-1.5" })}
          >
            <Plus className="h-4 w-4" />
            新規案件登録
          </Link>
        </div>
      </div>

      <ProjectsTable projects={(projects as unknown as ProjectItem[]) ?? []} />
    </div>
  )
}