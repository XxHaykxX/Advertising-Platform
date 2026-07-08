import { notFound } from "next/navigation";
import { getProject, getProjectIds } from "@/lib/data/projects";
import { getLocale } from "@/lib/data/locale";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ReportHero } from "@/components/report/report-hero";
import { KeyFacts } from "@/components/report/key-facts";
import { Cast } from "@/components/report/cast";
import { RoiSnapshot } from "@/components/report/roi-snapshot";
import { SafetyAssessment } from "@/components/report/safety-assessment";
import { Investment } from "@/components/report/investment";
import { DeepDive } from "@/components/report/deep-dive";
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

  const [project, locale] = await Promise.all([getProject(pid, true), getLocale()]);
  if (!project) notFound();

  return (
    <>
      <Header locale={locale} />
      <ReportTabs hasCast={project.actors.length > 0} locale={locale} />
      <div id="overview">
        <ReportHero project={project} locale={locale} />
        <KeyFacts project={project} locale={locale} />
      </div>
      <Cast project={project} locale={locale} />
      <RoiSnapshot project={project} locale={locale} />
      <SafetyAssessment project={project} locale={locale} />
      <Investment project={project} locale={locale} />
      <DeepDive project={project} locale={locale} />
      <Footer locale={locale} />
    </>
  );
}
