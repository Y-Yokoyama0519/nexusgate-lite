import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ログイン済みなら直接ランチャーへ、未ログインならログイン画面へ
  if (user) {
    redirect("/launcher");
  } else {
    redirect("/login");
  }
}