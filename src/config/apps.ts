import { Users, Briefcase, FileText, Settings, UserCheck, type LucideIcon } from "lucide-react"

export type AppId =
  | "operator-customers"
  | "operator-projects"
  | "operator-partners"
  | "partner-portal"
  | "accounting"
  | "admin-settings"

export type AppDefinition = {
  id: AppId
  title: string
  description: string
  icon: LucideIcon
  href: string
  disabled?: boolean
}

export const APPS: Record<AppId, AppDefinition> = {
  "operator-customers": {
    id: "operator-customers",
    title: "顧客管理",
    description: "取引先マスタの閲覧・新規登録",
    icon: Users,
    href: "/operator/customers",
    disabled: false,
  },
  "operator-projects": {
    id: "operator-projects",
    title: "案件管理",
    description: "プロジェクト進行・アサイン状況の管理",
    icon: Briefcase,
    href: "/operator/projects",
    disabled: false,
  },
  "operator-partners": { // 追加
    id: "operator-partners",
    title: "パートナー管理",
    description: "委託先パートナー・シフトの管理",
    icon: UserCheck,
    href: "/operator/partners",
    disabled: false,
  },
  "partner-portal": {
    id: "partner-portal",
    title: "パートナーポータル",
    description: "アサイン済み案件の確認・進捗報告",
    icon: Users,
    href: "/partner/projects",
    disabled: true,
  },
  "accounting": {
    id: "accounting",
    title: "経理・会計システム",
    description: "請求書の発行・売上データの集計",
    icon: FileText,
    href: "/accounting",
    disabled: true,
  },
  "admin-settings": {
    id: "admin-settings",
    title: "管理者設定",
    description: "ユーザー権限の管理・マスタ保守",
    icon: Settings,
    href: "/admin",
    disabled: true,
  },
}