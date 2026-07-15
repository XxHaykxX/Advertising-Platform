import Link from "next/link";
import { Container } from "@/components/ui/container";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { ForgotForm } from "./forgot-form";

export default async function ForgotPasswordPage() {
  const locale = await getLocale();
  const t = makeUI(locale);

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

          <h1 className="text-center text-2xl font-bold text-foreground">{t("auth.forgotTitle")}</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">{t("auth.forgotSubtitle")}</p>

          <ForgotForm locale={locale} />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              {t("login.signIn")}
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
