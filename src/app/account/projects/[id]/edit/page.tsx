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
import { getCountryOptions } from "@/lib/data/countries";
import { getStudioOptions } from "@/lib/data/studios";
import { getTierTemplates } from "@/lib/data/tier-templates";
import { projectCompleteness } from "@/lib/project-completeness";
import { labelSep, makeUI } from "@/lib/i18n";
import {
  formatDateInput,
  formatReleaseDateInput,
  normalizeReleasePrecision,
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
 *  account/projects/new/page.tsx. Milestones are loaded and seeded like every
 *  other relation: the Production Timeline section was opened to creators on
 *  2026-08-04 (owner request), so this page is no longer admin-only for it. */
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
      placements: { orderBy: { sortOrder: "asc" } },
      milestones: { orderBy: { sortOrder: "asc" } },
      owner: { select: { avatar: true } },
    },
  });
  // 404 for "doesn't exist", "not a CREATOR" and "not yours" alike — a member
  // navigating directly to someone else's edit URL gets the same response as
  // a bad id (same reasoning as the admin edit page's ownership check).
  if (!p) notFound();
  if (user.role !== "CREATOR" || p.ownerId !== user.id) notFound();

  // Studio options — the shared dictionary, same as the admin form (2026-07-27).
  const studios = await getStudioOptions();
  const tierTemplates = await getTierTemplates();

  // Person directory (Ф3), for the Cast & Crew name picker.
  const knownPeople = await getPersonDirectory();

  // Global Streaming Source dictionary (Ф2/#25), for the MultiSelect options.
  const streamingSources = await getStreamingSources();
  const countryOptions = await getCountryOptions();

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
    studio: p.studio,
    kind: p.kind,
    episodes: p.episodes,
    episodeMinutes: p.episodeMinutes,
    durationMinutes: p.durationMinutes,
    countries: p.countries,
    ageRating: p.ageRating,
    productionBudgetAmd: p.productionBudgetAmd,
    isActive: p.isActive,
    applicationDeadline: formatDateInput(p.applicationDeadline),
    applicationDeadlineOngoing: p.applicationDeadlineOngoing,
    releaseDate: formatReleaseDateInput(p.releaseDate, p.releasePrecision),
    releasePrecision: normalizeReleasePrecision(p.releasePrecision),
    platforms: parsePlatformsInput(p.platforms),
    tagline: p.tagline ?? "",
    taglineHy: p.taglineHy ?? "",
    taglineRu: p.taglineRu ?? "",
    taglineEn: p.taglineEn ?? "",
    references: p.references ?? "",
    cinemas: p.cinemas ?? "",
    videoEmbedUrl: p.videoEmbedUrl ?? "",
    videoFile: p.videoFile ?? "",
    // Sales deck (IA-44, 2026-08-05) — same "path or empty" contract as poster.
    presentationPdf: p.presentationPdf ?? "",
  };

  // "What a brand sees" (audit B8) — same computation as the admin edit page.
  const completeness = projectCompleteness({
    tagline: p.tagline ?? "",
    poster: p.poster,
    videoEmbedUrl: p.videoEmbedUrl,
    videoFile: p.videoFile,
    gallery: p.gallery,
    castCount: p.actors.length,
    milestonesCount: p.milestones.length,
    placementsCount: p.placements.length,
    tiers: p.tiers,
    studio: p.studio,
    kind: p.kind,
    episodes: p.episodes,
    episodeMinutes: p.episodeMinutes,
    durationMinutes: p.durationMinutes,
    references: p.references,
    applicationDeadline: p.applicationDeadline,
    applicationDeadlineOngoing: p.applicationDeadlineOngoing,
    releaseDate: p.releaseDate,
    platforms: p.platforms,
    cinemas: p.cinemas,
    productionBudgetAmd: p.productionBudgetAmd,
    ageRating: p.ageRating,
    formatCategory: p.formatCategory,
    countries: p.countries,
    castPhotoCount: p.actors.filter((a) => a.photo).length,
    titleHy: p.titleHy,
    titleRu: p.titleRu,
    titleEn: p.titleEn,
    synopsisHy: p.synopsisHy,
    synopsisRu: p.synopsisRu,
    synopsisEn: p.synopsisEn,
    taglineHy: p.taglineHy,
    taglineRu: p.taglineRu,
    taglineEn: p.taglineEn,
    placementPricing: p.placements.map((pl) => ({ priceAmd: pl.priceAmd })),
    // Feeds the placements grandfather clause (PLACEMENTS_REQUIRED_FROM) so
    // this checklist's "blocks publication" badge agrees with the actual gate.
    createdAt: p.createdAt,
  });

  const action = updateCreatorProject.bind(null, pid);

  return (
    <>
      <Reveal>
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("account.form.cancel")}
        </Link>
        <h1 className="mb-2 mt-4 text-3xl font-bold text-foreground md:text-4xl">
          {p.moderationStatus === "APPROVED" ? t("account.viewProject") : t("account.editProject")}
          {labelSep(locale)} {p.title}
        </h1>
        {/* "Saving sends the project back to moderation" is only true while it
            can still be saved — a published one is read-only, and the banner
            inside the form says what to do instead. */}
        {p.moderationStatus === "APPROVED" ? null : (
          <p className="mb-6 text-muted-foreground">{t("account.editProjectSubtitle")}</p>
        )}
      </Reveal>

      {/* Deliberately NOT wrapped in <Reveal>: framer-motion animates it with a
          `transform`, and a transformed ancestor becomes the containing block
          for `position: sticky` — which silently broke the form's own sticky
          save bar. */}
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
          // Legacy columns first, then the per-locale trio (IA-44). A row
          // saved before the language tabs existed has only the legacy pair
          // filled; the hy tab falls back to it in the editor the same way
          // the public page does, so nothing opens blank.
          name: tier.name,
          nameHy: tier.nameHy || tier.name,
          nameRu: tier.nameRu,
          nameEn: tier.nameEn,
          priceAmd: tier.priceAmd,
          benefits: parseBenefitsInput(tier.benefits),
          benefitsHy: parseBenefitsInput(tier.benefitsHy ?? tier.benefits),
          benefitsRu: parseBenefitsInput(tier.benefitsRu),
          benefitsEn: parseBenefitsInput(tier.benefitsEn),
          image: tier.image ?? "",
          isExclusive: tier.isExclusive,
          availableSlots: tier.availableSlots,
          totalSlots: tier.totalSlots,
        }))}
        initialPlacements={p.placements.map((pl) => ({
          // Same "carry the id" reasoning as initialTiers above.
          dbId: pl.id,
          title: pl.title,
          titleHy: pl.titleHy || pl.title,
          titleRu: pl.titleRu,
          titleEn: pl.titleEn,
          description: parseBenefitsInput(pl.description),
          descriptionHy: parseBenefitsInput(pl.descriptionHy ?? pl.description),
          descriptionRu: parseBenefitsInput(pl.descriptionRu),
          descriptionEn: parseBenefitsInput(pl.descriptionEn),
          image: pl.image ?? "",
          priceAmd: pl.priceAmd,
          availableSlots: pl.availableSlots,
          totalSlots: pl.totalSlots,
        }))}
        initialMilestones={p.milestones.map((m) => ({
          label: m.label,
          date: formatDateInput(m.date),
          note: m.note,
          active: m.isActive,
        }))}
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
        projectId={pid}
        ownerHasAvatar={!!p.owner.avatar}
        completeness={completeness}
        // Published listings are read-only for their creator — everything is
        // still visible, nothing is editable, and the banner points at the
        // editors (owner decision 2026-08-07). updateCreatorProject refuses
        // these server-side too.
        readOnly={p.moderationStatus === "APPROVED"}
      />
    </>
  );
}
