import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/require";
import { createProject } from "../actions";
import { ProjectForm } from "../project-form";

export default async function NewProjectPage() {
  const user = await requireUser();

  return (
    <div>
      <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold text-foreground">New project</h1>
      <ProjectForm
        action={createProject}
        submitLabel="Create project"
        isSuperadmin={user.role === "SUPERADMIN"}
      />
    </div>
  );
}
