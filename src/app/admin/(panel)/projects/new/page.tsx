import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createProject } from "../actions";
import { ProjectForm } from "../project-form";

export default function NewProjectPage() {
  return (
    <div>
      <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        К проектам
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold text-foreground">Новый проект</h1>
      <ProjectForm action={createProject} submitLabel="Создать проект" />
    </div>
  );
}
