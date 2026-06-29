import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { updateProject } from "../../actions";
import { ProjectForm, type ProjectFormInitial } from "../../project-form";

function isoDate(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}
function parseArr(s: string): string[] {
  try {
    const a = JSON.parse(s);
    return Array.isArray(a) ? a.map(String) : [];
  } catch {
    return [];
  }
}

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pid = Number(id);
  const p = await prisma.project.findUnique({
    where: { id: pid },
    include: {
      actors: { orderBy: { sortOrder: "asc" } },
      scenes: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!p) notFound();

  const initial: ProjectFormInitial = {
    titleRu: p.titleRu, titleEn: p.titleEn, titleHy: p.titleHy,
    genreRu: p.genreRu, genreEn: p.genreEn, genreHy: p.genreHy,
    descriptionRu: p.descriptionRu, descriptionEn: p.descriptionEn, descriptionHy: p.descriptionHy,
    placementTypeRu: p.placementTypeRu, placementTypeEn: p.placementTypeEn, placementTypeHy: p.placementTypeHy,
    poster: p.poster ?? "",
    gallery: parseArr(p.gallery),
    price: p.price ?? "", currency: p.currency ?? "",
    slotsTotal: p.slotsTotal, slotsAvailable: p.slotsAvailable,
    releaseDate: isoDate(p.releaseDate), bookingDeadline: isoDate(p.bookingDeadline),
    platforms: parseArr(p.platforms),
    sortOrder: p.sortOrder, isActive: p.isActive,
    actors: p.actors.map((a) => ({
      firstName: a.firstName, firstNameEn: a.firstNameEn, firstNameHy: a.firstNameHy,
      lastName: a.lastName, lastNameEn: a.lastNameEn, lastNameHy: a.lastNameHy,
      role: a.role, roleEn: a.roleEn, roleHy: a.roleHy,
      photo: a.photo ?? "",
    })),
    scenes: p.scenes.map((s) => ({
      title: s.title, titleEn: s.titleEn, titleHy: s.titleHy,
      description: s.description, descriptionEn: s.descriptionEn, descriptionHy: s.descriptionHy,
      placement: s.placement, placementEn: s.placementEn, placementHy: s.placementHy,
    })),
  };

  const action = updateProject.bind(null, pid);

  return (
    <div>
      <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold text-foreground">
        Edit: {p.titleRu}
      </h1>
      <ProjectForm action={action} initial={initial} submitLabel="Save" />
    </div>
  );
}
