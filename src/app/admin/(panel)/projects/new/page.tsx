import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireContentEditor } from "@/lib/auth/require";
import { getKnownPeople } from "@/lib/data/actors";
import { createProject } from "../actions";
import { ProjectForm } from "../project-form";

export default async function NewProjectPage() {
  const user = await requireContentEditor();

  // Distinct studio names already on file, for the Studio autocomplete.
  const rows = await prisma.project.findMany({
    where: { studio: { not: "" } },
    select: { studio: true },
    distinct: ["studio"],
  });
  const studios = rows.map((r) => r.studio).sort();

  // People previously entered as cast/crew on any project (#11), for the
  // Cast & Crew name autocomplete.
  const knownPeople = await getKnownPeople();

  // No owner yet on create — the poster generator's logo overlay (#26) falls
  // back to the current staff user's own avatar (see poster-action.ts).
  const me = await prisma.user.findUnique({ where: { id: user.id }, select: { avatar: true } });

  return (
    <div>
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold text-foreground">New project</h1>
      <ProjectForm
        action={createProject}
        submitLabel="Create project"
        studios={studios}
        knownPeople={knownPeople}
        ownerHasAvatar={!!me?.avatar}
      />
    </div>
  );
}
