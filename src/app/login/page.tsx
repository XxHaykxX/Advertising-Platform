import Link from "next/link";
import { Container } from "@/components/ui/container";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { googleConfigured } from "@/lib/auth/google";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  const locale = await getLocale();
  const t = makeUI(locale);
  const { status, error } = await searchParams;
  const notice =
    error === "google"
      ? t("login.errGoogle")
      : status === "pending"
        ? t("login.errPending")
        : status === "blocked"
          ? t("login.errBlocked")
          : status === "rejected"
            ? t("login.errRejected")
            : undefined;
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden py-20">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-[-10%] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <Container className="flex justify-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 card-lift">
          <Link href="/" className="mb-8 block text-center text-lg font-bold text-foreground">
            <span className="text-primary">i</span>Govazd
          </Link>

          <h1 className="text-center text-2xl font-bold text-foreground">{t("login.title")}</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {t("login.subtitle")}
          </p>

          <LoginForm locale={locale} googleEnabled={googleConfigured()} notice={notice} />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("login.noAccount")}{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              {t("login.registerLink")}
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
