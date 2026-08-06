import { SiteHeader } from "@/components/site-header";
import { OrganizationJsonLd } from "@/components/organization-json-ld";
import { Hero } from "@/components/hero";
import { Featured } from "@/components/featured";
import { Trust } from "@/components/trust";
import HowItWorks from "@/components/how-it-works";
import GetStarted from "@/components/get-started";
import Faq from "@/components/faq";
import { Footer } from "@/components/footer";
import { getProjects } from "@/lib/data/projects";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";

export default async function Home() {
  const locale = await getLocale();
  const currency = await getCurrency();
  const projects = await getProjects(locale, currency);

  return (
    <>
      <OrganizationJsonLd />
      <SiteHeader />
      <main>
        {/* IA-48 §3: the two trust numbers open the page now, directly under the
            hero, instead of sitting between Featured and GetStarted where they
            read as filler in the middle of a long grey band.
            IA-48 §2: the lead form used to close the page. It is gone — the
            footer already carries the contacts and /contact is a page of its
            own, so the homepage was asking for the same thing twice. */}
        <Hero locale={locale} />
        <Trust locale={locale} />
        <HowItWorks locale={locale} />
        <Featured projects={projects.slice(0, 6)} locale={locale} />
        {/* IA-48 §4: Featured ends on a row of cards and this section opens on a
            heading, so the two full section paddings stacked into ~190px of
            nothing. Halving this one's top closes the hole without touching the
            spacing rhythm every other section on the site keeps. */}
        <GetStarted locale={locale} className="pt-10 md:pt-12" />
        <Faq locale={locale} />
      </main>
      <Footer locale={locale} currency={currency} />
    </>
  );
}
