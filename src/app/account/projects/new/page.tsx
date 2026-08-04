import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { requireMember } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/data/locale";
import { getPersonDirectory } from "@/lib/data/actors";
import { getStreamingSources } from "@/lib/data/streaming-sources";
import { getCountryOptions } from "@/lib/data/countries";
import { getStudioOptions } from "@/lib/data/studios";
import { getTierTemplates } from "@/lib/data/tier-templates";
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

  // Studio options — the shared dictionary, same as the admin form (2026-07-27).
  const studios = await getStudioOptions();
  const tierTemplates = await getTierTemplates();

  // Person directory (Ф3), for the Cast & Crew name picker — same helper as
  // the admin new/page.tsx.
  const knownPeople = await getPersonDirectory();

  // Global Streaming Source dictionary (Ф2/#25), for the MultiSelect options
  // — same helper as the admin new/page.tsx. The delete-"×" itself stays
  // staff-only (ProjectForm hides it in creator mode).
  const streamingSources = await getStreamingSources();
  const countryOptions = await getCountryOptions();

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
        <p className="mb-2 text-muted-foreground">{t("account.submitProjectSubtitle")}</p>
        {/* Opens in a new tab on purpose: this form autosaves a draft but a
            same-tab navigation away from a half-filled 30-field form is still
            the last thing anyone wants mid-submission. */}
        <a
          href="/for-creators"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-primary underline-offset-2 hover:underline"
        >
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
          {t("forCreators.entryLink")}
        </a>
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
          tierTemplates={tierTemplates}
          streamingSources={streamingSources}
        countryOptions={countryOptions}
          knownPeople={knownPeople}
          ownerHasAvatar={!!me?.avatar}
        />
      </Reveal>
    </>
  );
}
