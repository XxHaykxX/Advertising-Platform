import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

/* Root 404. Without this file every broken link — a mistyped address, a
   project that was unpublished, an old bookmark — landed on Next's built-in
   "404: This page could not be found.": no header, no footer, no language
   switcher and no way back into the site (QA pass, 2026-08-14).

   Deliberately the same chrome as a normal page, so a visitor who lands here
   from a shared link still sees where they are and can carry on to the
   catalogue. */
export default async function NotFound() {
  const locale = await getLocale();
  const t = makeUI(locale);

  return (
    <>
      <SiteHeader />

      <main className="bg-background">
        <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">404</p>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{t("notFound.title")}</h1>
          <p className="max-w-md text-sm text-muted-foreground">{t("notFound.body")}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Button variant="primary" size="md" asChild>
              <Link href="/catalog">{t("btn.browseProjects")}</Link>
            </Button>
            <Button variant="ghost" size="md" asChild>
              <Link href="/">{t("legal.backToHome")}</Link>
            </Button>
          </div>
        </Container>
      </main>

      <Footer locale={locale} />
    </>
  );
}
