import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Catalog } from "@/components/sections/catalog";
import { Portfolio } from "@/components/sections/portfolio";
import { Partners } from "@/components/sections/partners";
import { Contact } from "@/components/sections/contact";
import { getProjects } from "@/lib/data/projects";
import { getPortfolioCases } from "@/lib/data/portfolio";
import { getPartners } from "@/lib/data/partners";
import { getContent } from "@/lib/data/content";
import { getContacts } from "@/lib/data/settings";
import { getLocale } from "@/lib/data/locale";

export default async function Home() {
  const locale = await getLocale();
  const [projects, cases, partners, t, contacts] = await Promise.all([
    getProjects(true, locale),
    getPortfolioCases(locale),
    getPartners(),
    getContent(locale),
    getContacts(),
  ]);

  return (
    <main className="flex flex-col">
      <Hero t={t} locale={locale} />
      <HowItWorks t={t} locale={locale} />
      <Catalog projects={projects} t={t} locale={locale} />
      <Portfolio cases={cases} t={t} locale={locale} />
      <Partners partners={partners} t={t} locale={locale} />
      <Contact t={t} contacts={contacts} locale={locale} projectTitles={projects.map((p) => p.title)} />
    </main>
  );
}
