import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { PageHero } from "@/components/ui/page-hero";
import Faq from "@/components/faq";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { makeUI } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "FAQ — iGovazd",
  description:
    "Answers to common questions about how iGovazd connects brands with film and content creators for product placement.",
  alternates: { canonical: "/faq" },
};

/** Standalone route for the same accordion the landing page embeds at
 *  /#faq (IA-37/38/39) — a signed-in member is confined away from "/" (see
 *  lib/auth/member-paths.ts) so the footer's FAQ link needs somewhere in the
 *  allow-list to actually land. Reuses the Faq component as-is; no content
 *  fork to keep in sync.
 *
 *  Gives the page its own h1 via the same PageHero its footer-column
 *  neighbours (/about, /portfolio) use, rather than leaving the component's
 *  own h2 as the only heading — `showTitle={false}` drops that h2 so the two
 *  don't stack. */
export default async function FaqPage() {
  const [locale, currency] = await Promise.all([getLocale(), getCurrency()]);
  const t = makeUI(locale);

  return (
    <>
      <SiteHeader />
      <PageHero title={t("faq.title")} locale={locale} />
      <Faq locale={locale} showTitle={false} />
      <Footer locale={locale} currency={currency} />
    </>
  );
}
