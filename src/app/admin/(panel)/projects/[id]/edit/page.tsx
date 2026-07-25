import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require";
import { getPersonDirectory } from "@/lib/data/actors";
import { getStreamingSources } from "@/lib/data/streaming-sources";
import { updateProject } from "../../actions";
import {
  formatDateInput,
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
  const user = await requireUser();
  const isSuperadmin = user.role === "SUPERADMIN";

  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();
  const p = await prisma.project.findUnique({
    where: { id: pid },
    include: {
      actors: { orderBy: { sortOrder: "asc" } },
      tiers: { orderBy: { sortOrder: "asc" } },
      milestones: { orderBy: { sortOrder: "asc" } },
      owner: { select: { avatar: true } },
    },
  });
  if (!p) notFound();
  // Ownership scoping: a Publisher navigating directly to another owner's
  // edit URL gets a 404 (indistinguishable from "doesn't exist").
  if (!isSuperadmin && p.ownerId !== user.id) notFound();

  // Distinct studio names already on file, for the Studio autocomplete.
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
    format: p.format,
    formatCategory: p.formatCategory,
    language: p.language,
    studio: p.studio,
    kind: p.kind,
    episodes: p.episodes,
    episodeMinutes: p.episodeMinutes,
    durationMinutes: p.durationMinutes,
    status: p.status,
    countries: p.countries,
    ageRating: p.ageRating,
    boxOfficeAmd: p.boxOfficeAmd,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
    applicationDeadline: formatDateInput(p.applicationDeadline),
    releaseDate: formatDateInput(p.releaseDate),
    expectedReleaseDate: formatDateInput(p.expectedReleaseDate),
    platforms: parsePlatformsInput(p.platforms),
    // The merged "Available on" field (#29) reads from `platforms` above —
    // streamingSource is no longer seeded into the form.
    streamingSource: "",
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

  const action = updateProject.bind(null, pid);

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

      <ProjectForm
        action={action}
        initial={initial}
        initialActors={p.actors.map((a) => ({
          name: a.name,
          roles: parseRolesInput(a.roles, a.role),
          kind: a.kind,
          photo: a.photo ?? "",
          personId: a.personId,
        }))}
        initialTiers={p.tiers.map((tier) => ({
          name: tier.name,
          priceAmd: tier.priceAmd,
          benefits: parseBenefitsInput(tier.benefits),
          isExclusive: tier.isExclusive,
          availableSlots: tier.availableSlots,
          totalSlots: tier.totalSlots,
        }))}
        initialMilestones={p.milestones.map((m) => ({
          label: m.label,
          date: formatDateInput(m.date),
          note: m.note,
          active: m.isActive,
        }))}
        submitLabel="Save"
        studios={studios}
        streamingSources={streamingSources}
        knownPeople={knownPeople}
        projectId={pid}
        ownerHasAvatar={!!p.owner.avatar}
      />
    </div>
  );
}
