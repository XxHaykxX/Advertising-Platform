import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { requireMember } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/data/locale";
import { getKnownPeople } from "@/lib/data/actors";
import { makeUI } from "@/lib/i18n";
import { ProjectForm } from "@/app/admin/(panel)/projects/project-form";
import { createCreatorProject } from "../actions";
import { translateCreatorProjectAction } from "../translate-action";
import { generateCreatorPosterAction } from "../poster-action";

/** "Подать проект" — a CREATOR's submission form. Reuses the admin
 *  ProjectForm wholesale (mode="creator") so the two sides stay 1:1 instead
 *  of drifting apart as a second, separately maintained form (see
 *  project-form.tsx's `mode` prop). BRAND members have no reason to be here —
 *  bounce them back to /account (same guard as the "My projects" list at
 *  /account/projects). */
export default async function NewProjectPage() {
  const user = await requireMember();
  if (user.role !== "CREATOR") redirect("/account");

  const locale = await getLocale();
  const t = makeUI(locale);

  // Distinct studio names already on file, for the Studio autocomplete —
  // same query as the admin new/page.tsx.
  const rows = await prisma.project.findMany({
    where: { studio: { not: "" } },
    select: { studio: true },
    distinct: ["studio"],
  });
  const studios = rows.map((r) => r.studio).sort();

  // People previously entered as cast/crew on any project (#11), for the
  // Cast & Crew name autocomplete — same helper as the admin new/page.tsx.
  const knownPeople = await getKnownPeople();

  // Gates the "logo" checkbox in the poster generator panel (#26).
  const me = await prisma.user.findUnique({ where: { id: user.id }, select: { avatar: true } });

  return (
    <>
      <Reveal>
        <Link
          href="/account/projects"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("account.form.cancel")}
        </Link>
        <h1 className="mb-2 mt-4 text-3xl font-bold text-foreground md:text-4xl">
          {t("account.submitProject")}
        </h1>
        <p className="mb-6 text-muted-foreground">{t("account.submitProjectSubtitle")}</p>
      </Reveal>

      <Reveal delay={0.05}>
        <ProjectForm
          action={createCreatorProject}
          mode="creator"
          locale={locale}
          translateAction={translateCreatorProjectAction}
          posterAction={generateCreatorPosterAction}
          submitLabel={t("account.form.submit")}
          studios={studios}
          knownPeople={knownPeople}
          ownerHasAvatar={!!me?.avatar}
        />
      </Reveal>
    </>
  );
}
