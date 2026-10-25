// /src/app/(apps)/layout.tsx"
import React from "react";

export default function AppsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* 
        (apps)配下の画面（ランチャーや各業務システム）共通の枠組み。
        将来的にここにヘッダーやサイドバー、共通ナビゲーションを追加します。
      */}
      <main>{children}</main>
    </div>
  );
}