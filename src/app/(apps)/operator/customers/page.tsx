import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { RefreshButton } from "@/components/common/refresh-button"
import { CustomersTable } from "./_components/customers-table"
import { type CustomerItem } from "./schema"

export const metadata = {
  title: '顧客管理',
}

export default async function CustomersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">顧客管理</h1>
          <p className="text-sm text-muted-foreground">
            取引先マスタの閲覧・新規登録
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton />
          <Link
            href="/operator/customers/new"
            className={buttonVariants({ variant: 'outline', className: "gap-1.5" })}
          >
            <Plus className="h-4 w-4" />
            新規顧客登録
          </Link>
        </div>
      </div>

      <CustomersTable customers={(customers as CustomerItem[]) ?? []} />
    </div>
  )
}