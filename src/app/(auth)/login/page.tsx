import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Alertとアイコンを読み込む
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
// サーバーアクションをインポート
import { login } from "./actions";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const isAuthError = params.error === "auth_failed";

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">NexusGate</CardTitle>
        <CardDescription>
          システムにアクセスするためにログインしてください。
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form action={login} className="grid gap-4">
          
          {isAuthError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>ログインエラー</AlertTitle>
              <AlertDescription>
                IDまたはパスワードが正しくありません。
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="password">パスワード</Label>
            <Input 
              id="password" 
              name="password"
              type="password" 
              required 
            />
          </div>
          
          <Button type="submit" className="w-full">
            ログイン
          </Button>
          
        </form>
      </CardContent>
    </Card>
  );
}