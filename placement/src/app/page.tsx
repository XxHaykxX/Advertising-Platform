import { Header } from "@/components/header";
import { OrganizationJsonLd } from "@/components/organization-json-ld";
import { Hero } from "@/components/hero";
import { Stats } from "@/components/stats";
import { Featured } from "@/components/featured";
import { Trust } from "@/components/trust";
import HowItWorks from "@/components/how-it-works";
import GetStarted from "@/components/get-started";
import Why from "@/components/why";
import Faq from "@/components/faq";
import Contact from "@/components/contact";
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
      <Header locale={locale} currency={currency} />
      <main>
        <Hero locale={locale} />
        <Stats locale={locale} />
        <Featured projects={projects.slice(0, 6)} locale={locale} />
        <Trust locale={locale} />
        <HowItWorks locale={locale} />
        <GetStarted locale={locale} />
        <Why locale={locale} />
        <Faq locale={locale} />
        <Contact locale={locale} />
      </main>
      <Footer locale={locale} currency={currency} />
    </>
  );
}
