import { Clapperboard } from "lucide-react";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const safeFrom = from && from.startsWith("/admin") ? from : "/admin";

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <Clapperboard className="h-5 w-5" />
          </span>
          <span className="text-base font-bold tracking-tight">
            AD<span className="text-primary">PLACEMENT</span>
          </span>
        </div>
        <h1 className="mb-1 text-xl font-bold text-foreground">Admin sign-in</h1>
        <p className="mb-6 text-sm text-white/55">
          Administrator access only.
        </p>
        <LoginForm from={safeFrom} />
      </div>
    </div>
  );
}
