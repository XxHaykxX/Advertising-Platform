import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

export default async function LoginPage() {
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

          <h1 className="text-center text-2xl font-bold text-foreground">{t("login.title")}</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {t("login.subtitle")}
          </p>

          <form className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-foreground">{t("form.email")}</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  disabled
                  placeholder={t("login.emailPlaceholder")}
                  className="w-full rounded-xl border border-border bg-muted py-3 pl-10 pr-4 text-sm text-muted-foreground outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-foreground">{t("login.password")}</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  disabled
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-muted py-3 pl-10 pr-4 text-sm text-muted-foreground outline-none"
                />
              </div>
            </label>

            <Button type="button" variant="primary" size="lg" disabled className="w-full">
              {t("login.signIn")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("login.notBrandYet")}{" "}
            <Link href="/#contact" className="font-medium text-primary hover:underline">
              {t("login.expressInterestInstead")}
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
