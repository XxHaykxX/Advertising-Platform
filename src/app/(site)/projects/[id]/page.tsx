import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProject, getProjectIds } from "@/lib/data/projects";
import { getLocale } from "@/lib/data/locale";
import { ProjectDetail } from "@/components/project-detail";
import { JsonLd } from "@/components/json-ld";
import { makeUI } from "@/lib/i18n";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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
  const locale = await getLocale();
  const project = await getProject(Number(id), locale);
  if (!project) return { title: "Not found" };
  return {
    title: project.title,
    description: project.description,
    alternates: { canonical: `/projects/${id}` },
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

  const ui = makeUI(locale);
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: ui("a11y.home"), item: SITE_URL },
      { "@type": "ListItem", position: 2, name: ui("nav.catalog"), item: `${SITE_URL}/catalog` },
      { "@type": "ListItem", position: 3, name: project.title, item: `${SITE_URL}/projects/${id}` },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumb} />
      <ProjectDetail project={project} locale={locale} />
    </>
  );
}
