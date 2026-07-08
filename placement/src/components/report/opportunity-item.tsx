import { moneyShort } from "@/lib/data/format";
import type { OpportunityDTO } from "@/lib/types";

function safetyColor(score: number) {
  if (score >= 80) return "var(--success)";
  if (score >= 60) return "var(--warn)";
  return "var(--danger)";
}

export function OpportunityItem({ opp }: { opp: OpportunityDTO; index?: number }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
          {opp.sceneNo}
        </span>
        <div className="min-w-0">
          <p className="text-[15px] leading-relaxed text-foreground">{opp.description}</p>
          <p className="mt-1 text-sm italic text-muted-foreground">{opp.mood}</p>
          <p className="mt-2 rounded-md border-l-2 border-primary bg-primary/5 px-3 py-2 text-sm text-foreground">
            {opp.rationale}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {opp.type}
            </span>
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {opp.prominence}
            </span>
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {opp.category}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-row items-center gap-4 sm:flex-col sm:items-end sm:gap-1.5">
        <span className="text-base font-bold text-foreground">{moneyShort(opp.estValue)}</span>
        <span className="text-sm text-muted-foreground">{opp.durationSec}s</span>
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: safetyColor(opp.safety) }}
          title={`Safety: ${opp.safety}/100`}
        />
      </div>
    </div>
  );
}
