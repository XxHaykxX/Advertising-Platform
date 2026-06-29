import type { Metadata } from "next";
import { Contact } from "@/components/sections/contact";
import { getProjects } from "@/lib/data/projects";
import { getContent } from "@/lib/data/content";
import { getContacts } from "@/lib/data/settings";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: makeUI(locale)("nav.contact") };
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const locale = await getLocale();
  const [projects, t, contacts] = await Promise.all([
    getProjects(true, locale),
    getContent(locale),
    getContacts(),
  ]);

  const { project } = await searchParams;
  const projectTitles = projects.map((p) => p.title);
  const initialProject =
    project && projectTitles.includes(project) ? project : "";

  return (
    <main>
      <Contact
        t={t}
        contacts={contacts}
        locale={locale}
        projectTitles={projectTitles}
        initialProject={initialProject}
      />
    </main>
  );
}
