import type { Metadata } from "next";
import { Hero } from "@/components/sections/hero";
import { HomeTeasers } from "@/components/sections/home-teasers";
import { getContent } from "@/lib/data/content";
import { getLocale } from "@/lib/data/locale";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const locale = await getLocale();
  const t = await getContent(locale);

  return (
    <main className="flex flex-col">
      <Hero t={t} locale={locale} />
      <HomeTeasers t={t} locale={locale} />
    </main>
  );
}
