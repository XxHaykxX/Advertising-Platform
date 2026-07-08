import { cookies } from "next/headers";
import { LoginForm } from "./login-form";
import { Logo } from "@/components/ui/logo";
import { LAST_EMAIL_COOKIE } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const safeFrom = from && from.startsWith("/admin") ? from : "/admin";
  const initialEmail = (await cookies()).get(LAST_EMAIL_COOKIE)?.value ?? "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-8 shadow-sm">
        <div className="mb-6">
          <Logo suffix="Admin" />
        </div>
        <h1 className="mb-1 text-xl font-bold text-foreground">Admin sign-in</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Sign in with your admin or publisher account.
        </p>
        <LoginForm from={safeFrom} initialEmail={initialEmail} />
      </div>
    </div>
  );
}
