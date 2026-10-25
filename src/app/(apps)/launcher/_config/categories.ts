import { type AppId } from "@/config/apps"

export type LauncherCategory = {
  category: string
  description: string
  appIds: AppId[]
}

export const LAUNCHER_CATEGORIES: LauncherCategory[] = [
  {
    category: "オペレーション業務",
    description: "日々の顧客対応、進行中プロジェクト、委託先パートナーの管理",
    appIds: ["operator-customers", "operator-projects", "operator-partners"], // 追加
  },
  {
    category: "外部ポータル・連携",
    description: "パートナー企業および委託先との情報連携",
    appIds: ["partner-portal"],
  },
  {
    category: "バックオフィス・管理",
    description: "請求・売上集計およびシステム基盤の保守",
    appIds: ["accounting", "admin-settings"],
  },
]