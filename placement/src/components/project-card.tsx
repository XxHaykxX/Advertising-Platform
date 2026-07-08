import Image from "next/image";
import Link from "next/link";
import { Clapperboard, Eye, Film, MapPin, Sparkles, Users, Wallet } from "lucide-react";
import { GenreBadge, SafetyBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApplyDialog } from "@/components/apply-dialog";
import { splitCountries } from "@/lib/data/format";
import type { ProjectListDTO } from "@/lib/types";

export function ProjectCard({ project }: { project: ProjectListDTO }) {
  const countries = splitCountries(project.countries);
  const shownCountries = countries.slice(0, 3);
  const extraCountries = countries.length - shownCountries.length;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card card-lift">
      <div className="relative aspect-[16/10] shrink-0">
        {project.poster ? (
          <Image
            src={project.poster}
            alt={project.title}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Film className="h-10 w-10 text-primary/40" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <GenreBadge>{project.genre}</GenreBadge>
        </div>
        <div className="absolute right-3 top-3">
          <SafetyBadge safety={project.safety} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-semibold text-foreground md:text-xl">{project.title}</h3>
        <code className="text-xs text-muted-foreground">{project.code}</code>
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{project.synopsis}</p>

        <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clapperboard className="h-3.5 w-3.5 shrink-0" />
            <span>{project.format}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>
              {shownCountries.join(", ")}
              {extraCountries > 0 ? ` +${extraCountries}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>{project.audienceGender}, {project.audienceAge}</span>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>{project.opportunitiesCount} opportunities</span>
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="h-3.5 w-3.5 shrink-0" />
            <span>{project.budgetRange}</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 shrink-0" />
            <span>{project.projViews} projected views</span>
          </div>
        </div>

        <div className="mt-auto flex gap-3 pt-6">
          <Button asChild variant="primary" size="sm">
            <Link href={`/reports/${project.id}`}>View Report</Link>
          </Button>
          <ApplyDialog
            projectId={project.id}
            projectTitle={project.title}
            trigger={
              <Button variant="ghost" size="sm">
                Request details
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}
