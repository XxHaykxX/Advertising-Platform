import { getProjects } from "@/lib/data/projects";
import { getLocale } from "@/lib/data/locale";
import { CatalogView } from "./catalog-view";

export default async function CatalogPage() {
  const [projects, locale] = await Promise.all([getProjects(), getLocale()]);
  return <CatalogView projects={projects} locale={locale} />;
}
