import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require";
import { updateProject } from "../../actions";
import { formatDateInput, parsePlatformsInput, parseGalleryInput } from "../../form-shared";
import { ProjectForm, type ProjectFormInitial } from "../../project-form";
import { OpportunitiesEditor } from "../../opportunities-editor";
import { ActorsEditor } from "../../actors-editor";

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
      opportunities: { orderBy: { sortOrder: "asc" } },
      actors: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!p) notFound();
  // Ownership scoping: a Publisher navigating directly to another owner's
  // edit URL gets a 404 (indistinguishable from "doesn't exist").
  if (!isSuperadmin && p.ownerId !== user.id) notFound();

  const initial: ProjectFormInitial = {
    title: p.title,
    code: p.code,
    genre: p.genre,
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
    status: p.status,
    releaseLabel: p.releaseLabel,
    countries: p.countries,
    audienceGender: p.audienceGender,
    audienceAge: p.audienceAge,
    projViews: p.projViews,
    budgetMinAmd: p.budgetMinAmd,
    budgetMaxAmd: p.budgetMaxAmd,
    cpmMinAmd: p.cpmMinAmd,
    cpmMaxAmd: p.cpmMaxAmd,
    priceMinAmd: p.priceMinAmd,
    priceMaxAmd: p.priceMaxAmd,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
    slotsTotal: p.slotsTotal,
    slotsTaken: p.slotsTaken,
    applicationDeadline: formatDateInput(p.applicationDeadline),
    releaseDate: formatDateInput(p.releaseDate),
    platforms: parsePlatformsInput(p.platforms),
    placementType: p.placementType ?? "",
    priceNote: p.priceNote ?? "",
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

      <ProjectForm action={action} initial={initial} submitLabel="Save" />

      <div className="mt-10 max-w-3xl">
        <h2 className="mb-4 text-lg font-bold text-foreground">Placement opportunities</h2>
        <OpportunitiesEditor
          projectId={pid}
          opportunities={p.opportunities.map((o) => ({
            sceneNo: o.sceneNo,
            description: o.description,
            mood: o.mood,
            rationale: o.rationale,
            type: o.type,
            prominence: o.prominence,
            category: o.category,
            estValue: o.estValue,
            durationSec: o.durationSec,
          }))}
        />
      </div>

      <div className="mt-10 max-w-3xl">
        <h2 className="mb-4 text-lg font-bold text-foreground">Actors</h2>
        <ActorsEditor
          projectId={pid}
          actors={p.actors.map((a) => ({ id: a.id, name: a.name, role: a.role }))}
        />
      </div>
    </div>
  );
}
