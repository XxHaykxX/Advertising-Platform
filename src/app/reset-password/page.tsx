import Link from "next/link";
import { Container } from "@/components/ui/container";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { ResetForm } from "./reset-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const locale = await getLocale();
  const t = makeUI(locale);
  const { token } = await searchParams;

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

          <h1 className="text-center text-2xl font-bold text-foreground">{t("auth.resetTitle")}</h1>

          {token ? (
            <ResetForm locale={locale} token={token} />
          ) : (
            <p className="mt-8 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-center text-sm text-primary">
              {t("auth.resetInvalidLink")}
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
