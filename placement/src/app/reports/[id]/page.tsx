import { notFound } from "next/navigation";
import { getProject, getProjectIds } from "@/lib/data/projects";
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

  const project = await getProject(pid, true);
  if (!project) notFound();

  return (
    <>
      <ReportTabs hasCast={project.actors.length > 0} />
      <div id="overview">
        <ReportHero project={project} />
        <KeyFacts project={project} />
      </div>
      <Cast project={project} />
      <RoiSnapshot project={project} />
      <SafetyAssessment project={project} />
      <Investment project={project} />
      <DeepDive project={project} />
      <Footer />
    </>
  );
}
