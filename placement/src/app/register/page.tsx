import Link from "next/link";
import { Building2, Film, Mail, User } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

export default async function RegisterPage() {
  const locale = await getLocale();
  const t = makeUI(locale);
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden py-20">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-[-10%] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <Container className="flex justify-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 card-lift">
          <Link href="/" className="mb-8 flex items-center justify-center gap-1 text-lg font-bold text-foreground">
            <span className="text-primary">FP</span> Placement
          </Link>

          <h1 className="text-center text-2xl font-bold text-foreground">{t("register.title")}</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {t("register.subtitle")}
          </p>

          <form className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-foreground">{t("register.fullName")}</span>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  disabled
                  placeholder={t("register.fullNamePlaceholder")}
                  className="w-full rounded-xl border border-border bg-muted py-3 pl-10 pr-4 text-sm text-muted-foreground outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-foreground">{t("register.workEmail")}</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  disabled
                  placeholder="you@brand.com"
                  className="w-full rounded-xl border border-border bg-muted py-3 pl-10 pr-4 text-sm text-muted-foreground outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-foreground">{t("form.company")}</span>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  disabled
                  placeholder={t("register.companyPlaceholder")}
                  className="w-full rounded-xl border border-border bg-muted py-3 pl-10 pr-4 text-sm text-muted-foreground outline-none"
                />
              </div>
            </label>

            <Button asChild variant="primary" size="lg" className="w-full">
              <Link href="/#contact">{t("register.expressInterest")}</Link>
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("register.alreadyHaveAccess")}{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              {t("register.signIn")}
            </Link>
          </p>

          <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
            <Film className="h-4 w-4 shrink-0 text-primary" />
            {t("register.filmmakerOrAdmin")}{" "}
            <Link href="/admin/login" className="font-medium text-primary hover:underline">
              {t("register.goToAdminLogin")}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
