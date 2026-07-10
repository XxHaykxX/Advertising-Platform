import { notFound } from "next/navigation";
import { getProject, getProjectIds } from "@/lib/data/projects";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ReportHero } from "@/components/report/report-hero";
import { KeyFacts } from "@/components/report/key-facts";
import { Cast } from "@/components/report/cast";
import { RoiSnapshot } from "@/components/report/roi-snapshot";
import { ReportTabs } from "./report-tabs";

export async function generateStaticParams() {
  const ids = await getProjectIds();
  return ids.map((id) => ({ id: String(id) }));
}

export const dynamicParams = true;

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();

  const locale = await getLocale();
  const currency = await getCurrency();
  const project = await getProject(pid, locale, currency, true);
  if (!project) notFound();

  return (
    <>
      <Header locale={locale} currency={currency} />
      <ReportTabs hasCast={project.actors.length > 0} locale={locale} />
      <div id="overview">
        <ReportHero project={project} locale={locale} />
        <KeyFacts project={project} locale={locale} />
      </div>
      <Cast project={project} locale={locale} />
      <RoiSnapshot project={project} locale={locale} />
      <Footer locale={locale} currency={currency} />
    </>
  );
}
