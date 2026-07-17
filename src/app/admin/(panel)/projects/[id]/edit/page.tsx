import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require";
import { getKnownPeople } from "@/lib/data/actors";
import { updateProject } from "../../actions";
import {
  formatDateInput,
  parsePlatformsInput,
  parseGalleryInput,
  parseBenefitsInput,
  parseGenresInput,
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

  // People previously entered as cast/crew on any project (#11), for the
  // Cast & Crew name autocomplete.
  const knownPeople = await getKnownPeople();

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
    studio: p.studio,
    kind: p.kind,
    episodes: p.episodes,
    episodeMinutes: p.episodeMinutes,
    status: p.status,
    releaseLabel: p.releaseLabel,
    countries: p.countries,
    audienceGender: p.audienceGender,
    audienceAge: p.audienceAge,
    ageRating: p.ageRating,
    projViews: p.projViews,
    budgetMinAmd: p.budgetMinAmd,
    budgetMaxAmd: p.budgetMaxAmd,
    cpmMinAmd: p.cpmMinAmd,
    cpmMaxAmd: p.cpmMaxAmd,
    priceMinAmd: p.priceMinAmd,
    priceMaxAmd: p.priceMaxAmd,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
    applicationDeadline: formatDateInput(p.applicationDeadline),
    releaseDate: formatDateInput(p.releaseDate),
    platforms: parsePlatformsInput(p.platforms),
    placementType: p.placementType ?? "",
    priceNote: p.priceNote ?? "",
    tagline: p.tagline ?? "",
    subgenre: p.subgenre ?? "",
    references: p.references ?? "",
    cinemas: p.cinemas ?? "",
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
          role: a.role,
          kind: a.kind,
          photo: a.photo ?? "",
        }))}
        initialTiers={p.tiers.map((tier) => ({
          name: tier.name,
          priceAmd: tier.priceAmd,
          benefits: parseBenefitsInput(tier.benefits),
        }))}
        submitLabel="Save"
        studios={studios}
        knownPeople={knownPeople}
        projectId={pid}
        ownerHasAvatar={!!p.owner.avatar}
      />
    </div>
  );
}
