import type { Metadata } from "next";
import { HowItWorks } from "@/components/sections/how-it-works";
import { getContent } from "@/lib/data/content";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getContent(locale);
  return {
    title: makeUI(locale)("nav.how"),
    description: t["how.subtitle"],
    alternates: { canonical: "/how-it-works" },
  };
}

export default async function HowItWorksPage() {
  const locale = await getLocale();
  const t = await getContent(locale);

  return (
    <main>
      <HowItWorks t={t} locale={locale} />
    </main>
  );
}
