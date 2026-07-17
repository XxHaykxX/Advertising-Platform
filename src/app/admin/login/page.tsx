import { cookies } from "next/headers";
import { LoginForm } from "./login-form";
import { Logo } from "@/components/ui/logo";
import { LAST_EMAIL_COOKIE } from "@/lib/auth/session";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const safeFrom = from && from.startsWith("/admin") ? from : "/admin";
  const initialEmail = (await cookies()).get(LAST_EMAIL_COOKIE)?.value ?? "";
  const locale = await getLocale();
  const t = makeUI(locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-8 shadow-sm">
        <div className="mb-6">
          <Logo suffix="Admin" />
        </div>
        <h1 className="mb-1 text-xl font-bold text-foreground">{t("adminLogin.title")}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{t("adminLogin.subtitle")}</p>
        <LoginForm from={safeFrom} initialEmail={initialEmail} locale={locale} />
      </div>
    </div>
  );
}
