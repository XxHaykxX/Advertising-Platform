import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProject, getProjectIds } from "@/lib/data/projects";
import { getLocale } from "@/lib/data/locale";
import { ProjectDetail } from "@/components/project-detail";

export async function generateStaticParams() {
  // DB may be unreachable at build time (it lives only on the server). Failing
  // soft yields zero prebuilt params; pages then render on demand at request
  // time when the DB is reachable. dynamicParams defaults to true.
  try {
    const ids = await getProjectIds();
    return ids.map((id) => ({ id: String(id) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(Number(id));
  if (!project) return { title: "Проект не найден" };
  return {
    title: `${project.title} — AD PLACEMENT`,
    description: project.description,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const project = await getProject(Number(id), locale);
  if (!project) notFound();
  return <ProjectDetail project={project} locale={locale} />;
}
