import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireContentEditor } from "@/lib/auth/require";
import { parseAttrs } from "@/lib/ad-channel-attrs";
import { getPersonDirectory } from "@/lib/data/actors";
import { pickPersonName } from "@/lib/person-name";
import { getStreamingSources } from "@/lib/data/streaming-sources";
import { getCountryOptions } from "@/lib/data/countries";
import { getStudioOptions } from "@/lib/data/studios";
import { getTierTemplates } from "@/lib/data/tier-templates";
import { projectCompleteness } from "@/lib/project-completeness";
import { buildEntityHistoryGroups, getEntityHistory } from "@/app/admin/(panel)/history/lib";
import { EntityEditTabs } from "@/app/admin/(panel)/history/entity-edit-tabs";
import { EntityHistoryPanel } from "@/app/admin/(panel)/history/entity-history-panel";
import { updateProject } from "../../actions";
import {
  formatDateInput,
  formatReleaseDateInput,
  normalizeReleasePrecision,
  parsePlatformsInput,
  parseGalleryInput,
  parseBenefitsInput,
  parseGenresInput,
  parseRolesInput,
} from "../../form-shared";
import { ProjectForm, type ProjectFormInitial } from "../../project-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireContentEditor();
  const isSuperadmin = user.role === "SUPERADMIN";

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
  if (!p) notFound();
  // Ownership scoping: a Publisher navigating directly to another owner's
  // edit URL gets a 404 (indistinguishable from "doesn't exist").
  if (!isSuperadmin && p.ownerId !== user.id) notFound();

  // Studio options — the dictionary, not distinct project values (2026-07-27).
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
    // sortOrder is not a form value any more (audit 1.2) — the catalog order
    // belongs to the drag-and-drop list, and round-tripping it through the
    // form reset it to 0 on every save.
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
    eventCity: p.eventCity,
    eventDate: formatDateInput(p.eventDate),
    eventCategory: p.eventCategory,
    attrs: parseAttrs(p.attrs),
  };

  // "What a brand sees" (audit B8) — computed from the SAVED row (`p`), which
  // already carries every relation this needs (actors/tiers/placements/
  // milestones counts).
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

  const action = updateProject.bind(null, pid);

  // "History" tab (task #25) — every save of this project, in place next to
  // the form that makes them. See buildEntityHistoryGroups for the collapsing
  // rule (same one the /admin/history feed uses).
  const historyGroups = buildEntityHistoryGroups(await getEntityHistory("Project", pid));

  return (
    <div>
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold text-foreground">Edit: {p.title}</h1>

      <EntityEditTabs
        history={<EntityHistoryPanel entity="Project" entityId={pid} groups={historyGroups} canRestore={isSuperadmin} />}
      >
        <ProjectForm
          action={action}
          initial={initial}
          initialActors={p.actors.map((a) => ({
            // The admin form is English-only, so show the English spelling —
            // the server re-snapshots all three from the directory on save.
            name: pickPersonName("en", a, a.name),
            roles: parseRolesInput(a.roles, a.role),
            kind: a.kind,
            photo: a.photo ?? "",
            personId: a.personId,
          }))}
          initialTiers={p.tiers.map((tier) => ({
            // Carries the DB id so a save updates this tier in place instead of
            // deleting and re-creating it (which detached brand applications).
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
            placementType: pl.placementType ?? "", // null (never classified) -> the select's "not set" option
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
          submitLabel="Save"
          studios={studios}
          tierTemplates={tierTemplates}
          streamingSources={streamingSources}
          countryOptions={countryOptions}
          knownPeople={knownPeople}
          projectId={pid}
          ownerHasAvatar={!!p.owner.avatar}
          completeness={completeness}
        />
      </EntityEditTabs>
    </div>
  );
}
