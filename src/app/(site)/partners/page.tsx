import type { Metadata } from "next";
import { Partners } from "@/components/sections/partners";
import { getPartners } from "@/lib/data/partners";
import { getContent } from "@/lib/data/content";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: makeUI(locale)("nav.partners") };
}

export default async function PartnersPage() {
  const locale = await getLocale();
  const [partners, t] = await Promise.all([
    getPartners(),
    getContent(locale),
  ]);

  return (
    <main>
      <Partners partners={partners} t={t} locale={locale} />
    </main>
  );
}
