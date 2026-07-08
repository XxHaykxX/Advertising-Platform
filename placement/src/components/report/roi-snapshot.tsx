import Link from "next/link";
import { Info, Lock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { moneyShort } from "@/lib/data/format";
import type { ProjectDetailDTO } from "@/lib/types";

export function ExpressInterestBanner({ className }: { className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 ${className ?? ""}`}
    >
      <div className="flex items-center gap-3">
        <Lock className="h-4 w-4 shrink-0 text-primary" />
        <p className="text-sm text-foreground">
          Full details unlocked after mutual interest
        </p>
      </div>
      <Button asChild variant="primary" size="sm">
        <Link href="/#contact">Express Interest</Link>
      </Button>
    </div>
  );
}

function MetricLabel({ children, tooltip }: { children: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <span>{children}</span>
      <span title={tooltip} className="inline-flex cursor-help">
        <Info className="h-3.5 w-3.5 shrink-0" />
      </span>
    </div>
  );
}

export function RoiSnapshot({ project }: { project: ProjectDetailDTO }) {
  const uniqueTypes = new Set(project.opportunities.map((o) => o.category)).size;

  return (
    <section id="roi" className="py-10">
      <div className="mx-auto w-full max-w-[1200px] px-6 max-sm:px-4">
        <Reveal>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <TrendingUp className="h-4 w-4" />
              Estimated ROI Snapshot
            </div>

            <div className="mt-6 grid grid-cols-4 gap-6 max-sm:grid-cols-2">
              <div>
                <div className="text-2xl font-extrabold text-foreground">
                  {moneyShort(project.exposureTotal)}
                </div>
                <MetricLabel tooltip="Methodology: sum of estimated exposure value across all identified placement opportunities.">
                  Estimated Exposure Value
                </MetricLabel>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-foreground">{project.projViews}</div>
                <MetricLabel tooltip="Methodology: modeled viewership derived from format, genre, and audience benchmarks.">
                  Projected Viewers
                </MetricLabel>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-foreground">{project.cpmRange}</div>
                <MetricLabel tooltip="Methodology: cost-per-thousand-impressions range benchmarked against comparable placements.">
                  CPM
                </MetricLabel>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-foreground">
                  {project.opportunitiesCount} <span className="text-base font-medium text-muted-foreground">across {uniqueTypes} types</span>
                </div>
                <MetricLabel tooltip="Methodology: distinct placement opportunities identified across scene-level script analysis.">
                  Placements
                </MetricLabel>
              </div>
            </div>

            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              This project offers {moneyShort(project.exposureTotal)} in estimated brand exposure
              across {project.opportunitiesCount} scene-level placement opportunities, with pricing
              benchmarked against comparable format, genre, and audience profiles.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Projections powered by industry benchmark data.
            </p>

            <ExpressInterestBanner className="mt-6" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
