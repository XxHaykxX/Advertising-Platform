import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { requireMember } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/data/locale";
import { getPersonDirectory } from "@/lib/data/actors";
import { pickPersonName } from "@/lib/person-name";
import { getStreamingSources } from "@/lib/data/streaming-sources";
import { makeUI } from "@/lib/i18n";
import {
  formatDateInput,
  parsePlatformsInput,
  parseGalleryInput,
  parseBenefitsInput,
  parseGenresInput,
  parseRolesInput,
} from "@/app/admin/(panel)/projects/form-shared";
import { ProjectForm, type ProjectFormInitial } from "@/app/admin/(panel)/projects/project-form";
import { updateCreatorProject } from "../../actions";
import { translateCreatorProjectAction } from "../../translate-action";
import { generateCreatorPosterAction } from "../../poster-action";

/** "Редактировать проект" — a CREATOR editing their OWN project (audit 2.4 /
 *  owner decision C.6). Twin of admin/(panel)/projects/[id]/edit/page.tsx, but
 *  scoped to the owning creator and wired to updateCreatorProject instead of
 *  the admin action — same "reuse ProjectForm, don't fork it" reasoning as
 *  account/projects/new/page.tsx. Milestones are intentionally never loaded:
 *  that section is admin-only (see project-form.tsx), so there's nothing for
 *  this page to seed. */
export default async function EditCreatorProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireMember();
  const locale = await getLocale();
  const t = makeUI(locale);

  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();

  const p = await prisma.project.findUnique({
    where: { id: pid },
    include: {
      actors: { orderBy: { sortOrder: "asc" } },
      tiers: { orderBy: { sortOrder: "asc" } },
      owner: { select: { avatar: true } },
    },
  });
  // 404 for "doesn't exist", "not a CREATOR" and "not yours" alike — a member
  // navigating directly to someone else's edit URL gets the same response as
  // a bad id (same reasoning as the admin edit page's ownership check).
  if (!p) notFound();
  if (user.role !== "CREATOR" || p.ownerId !== user.id) notFound();

  // Distinct studio names already on file, for the Studio autocomplete — same
  // query as new/page.tsx and the admin edit page.
  const studioRows = await prisma.project.findMany({
    where: { studio: { not: "" } },
    select: { studio: true },
    distinct: ["studio"],
  });
  const studios = studioRows.map((r) => r.studio).sort();

  // Person directory (Ф3), for the Cast & Crew name picker.
  const knownPeople = await getPersonDirectory();

  // Global Streaming Source dictionary (Ф2/#25), for the MultiSelect options.
  const streamingSources = await getStreamingSources();

  const initial: ProjectFormInitial = {
    title: p.title,
    code: p.code,
    genre: p.genre,
    genres: parseGenresInput(p.genres, p.genre),
    synopsis: p.synopsis,
    titleHy: p.titleHy ?? "",
    titleRu: p.titleRu ?? "",
    titleEn: p.titleEn ?? "",
    synopsisHy: p.synopsisHy ?? "",
    synopsisRu: p.synopsisRu ?? "",
    synopsisEn: p.synopsisEn ?? "",
    poster: p.poster ?? "",
    gallery: parseGalleryInput(p.gallery),
    formatCategory: p.formatCategory,
    language: p.language,
    studio: p.studio,
    kind: p.kind,
    episodes: p.episodes,
    episodeMinutes: p.episodeMinutes,
    durationMinutes: p.durationMinutes,
    countries: p.countries,
    ageRating: p.ageRating,
    boxOfficeAmd: p.boxOfficeAmd,
    productionBudgetAmd: p.productionBudgetAmd,
    isActive: p.isActive,
    applicationDeadline: formatDateInput(p.applicationDeadline),
    releaseDate: formatDateInput(p.releaseDate),
    expectedReleaseDate: formatDateInput(p.expectedReleaseDate),
    platforms: parsePlatformsInput(p.platforms),
    placementType: p.placementType ?? "",
    tagline: p.tagline ?? "",
    taglineHy: p.taglineHy ?? "",
    taglineRu: p.taglineRu ?? "",
    taglineEn: p.taglineEn ?? "",
    references: p.references ?? "",
    cinemas: p.cinemas ?? "",
    videoEmbedUrl: p.videoEmbedUrl ?? "",
    videoFile: p.videoFile ?? "",
  };

  const action = updateCreatorProject.bind(null, pid);

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
          {t("account.editProject")}: {p.title}
        </h1>
        <p className="mb-6 text-muted-foreground">{t("account.editProjectSubtitle")}</p>
      </Reveal>

      <Reveal delay={0.05}>
        <ProjectForm
          action={action}
          initial={initial}
          initialActors={p.actors.map((a) => ({
            // Shown in the member's own language; the server re-snapshots every
            // spelling from the Person directory on save.
            name: pickPersonName(locale, a, a.name),
            roles: parseRolesInput(a.roles, a.role),
            kind: a.kind,
            photo: a.photo ?? "",
            personId: a.personId,
          }))}
          initialTiers={p.tiers.map((tier) => ({
            // Carries the DB id so a save updates this tier in place instead of
            // deleting and re-creating it (which detached brand applications
            // and dropped any slot already reserved on it).
            dbId: tier.id,
            name: tier.name,
            priceAmd: tier.priceAmd,
            benefits: parseBenefitsInput(tier.benefits),
            isExclusive: tier.isExclusive,
            availableSlots: tier.availableSlots,
            totalSlots: tier.totalSlots,
          }))}
          mode="creator"
          locale={locale}
          translateAction={translateCreatorProjectAction}
          posterAction={generateCreatorPosterAction}
          submitLabel={t("account.form.submit")}
          studios={studios}
          streamingSources={streamingSources}
          knownPeople={knownPeople}
          projectId={pid}
          ownerHasAvatar={!!p.owner.avatar}
        />
      </Reveal>
    </>
  );
}
