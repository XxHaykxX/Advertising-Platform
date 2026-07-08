import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  Download,
  Film,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { parseStringArray, splitCountries } from "@/lib/data/format";
import type { ProjectDetailDTO } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  PRE_PRODUCTION: "Pre-Production",
  FILMING: "Filming",
  POST_PRODUCTION: "Post-Production",
  RELEASED: "Released",
};

function safetyColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warn";
  return "text-danger";
}

export function ReportHero({ project }: { project: ProjectDetailDTO }) {
  const countries = splitCountries(project.countries).join(", ");
  const thumbnails = parseStringArray(project.gallery).slice(0, 5);
  const placeholderCount = Math.max(0, 5 - thumbnails.length);
  const statusLabel = STATUS_LABEL[project.status] ?? project.status;
  const safetyClass = safetyColor(project.safetyScore);

  const metaItems = [
    project.genre,
    project.format,
    project.studio,
    countries,
    `${project.audienceGender} ${project.audienceAge}`,
    project.releaseLabel,
  ].filter(Boolean);

  return (
    <section className="pt-28 pb-4">
      <div className="mx-auto w-full max-w-[1200px] px-6 max-sm:px-4">
        <div className="mb-5 rounded-xl bg-warn/10 px-4 py-2.5 text-sm text-warn">
          Demo data — sample report.
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Catalog
            </Link>
            <span className="text-muted-foreground">
              Catalog | {project.code}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm">
              <Share2 className="mr-1.5 h-4 w-4" />
              Share
            </Button>
            <Button variant="secondary" size="sm">
              <Download className="mr-1.5 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        <Reveal>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            {project.title}
          </h1>
          <code className="mt-1 block text-sm text-muted-foreground">{project.code}</code>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-muted">
              {project.poster ? (
                <Image
                  src={project.poster}
                  alt={project.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <Film className="h-12 w-12 text-primary/40" />
                </div>
              )}
              <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                {statusLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card p-4">
                <Eye className="h-4 w-4 text-primary" />
                <div className="mt-2 text-lg font-bold text-foreground">{project.projViews}</div>
                <div className="text-xs text-muted-foreground">Projected Views</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                {project.safetyScore >= 80 ? (
                  <ShieldCheck className={`h-4 w-4 ${safetyClass}`} />
                ) : (
                  <ShieldAlert className={`h-4 w-4 ${safetyClass}`} />
                )}
                <div className={`mt-2 text-lg font-bold ${safetyClass}`}>
                  {project.safetyScore}/100
                </div>
                <div className="text-xs text-muted-foreground">Brand Safety</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <DollarSign className="h-4 w-4 text-primary" />
                <div className="mt-2 text-lg font-bold text-foreground">{project.cpmRange}</div>
                <div className="text-xs text-muted-foreground">CPM</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <Wallet className="h-4 w-4 text-primary" />
                <div className="mt-2 text-lg font-bold text-foreground">{project.budgetRange}</div>
                <div className="text-xs text-muted-foreground">Budget Range</div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-6 flex flex-wrap gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {metaItems.map((item, idx) => (
              <span key={idx} className="inline-flex items-center gap-2">
                {item}
                {idx < metaItems.length - 1 ? <span aria-hidden>·</span> : null}
              </span>
            ))}
          </p>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
            {project.synopsis}
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-6 grid grid-cols-5 gap-3 max-sm:grid-cols-3">
            {thumbnails.map((src, idx) => (
              <div key={idx} className="relative aspect-video overflow-hidden rounded-lg border border-border">
                <Image src={src} alt={`Storyboard ${idx + 1}`} fill className="object-cover" sizes="20vw" />
              </div>
            ))}
            {Array.from({ length: placeholderCount }).map((_, idx) => (
              <div
                key={`placeholder-${idx}`}
                className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-border bg-muted"
              >
                <Film className="h-5 w-5 text-muted-foreground/50" />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
