import type { Metadata } from "next";
import { Catalog } from "@/components/sections/catalog";
import { getProjects } from "@/lib/data/projects";
import { getContent } from "@/lib/data/content";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: makeUI(locale)("nav.catalog") };
}

export default async function CatalogPage() {
  const locale = await getLocale();
  const [projects, t] = await Promise.all([
    getProjects(true, locale),
    getContent(locale),
  ]);

  return (
    <main>
      <Catalog projects={projects} t={t} locale={locale} />
    </main>
  );
}
