import { Sparkles } from "lucide-react";
import { Gauge } from "@/components/ui/gauge";
import { ScoreBar } from "@/components/ui/score-bar";
import { Reveal } from "@/components/ui/reveal";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import type { ProjectDetailDTO } from "@/lib/types";

function verdict(score: number, t: (key: string) => string) {
  if (score >= 80) return { label: t("safety.verdictSafe"), className: "text-success" };
  if (score >= 60) return { label: t("safety.verdictReview"), className: "text-warn" };
  return { label: t("safety.verdictHighRisk"), className: "text-danger" };
}

export function SafetyAssessment({
  project,
  locale = DEFAULT_LOCALE,
}: {
  project: ProjectDetailDTO;
  locale?: Locale;
}) {
  const t = makeUI(locale);
  const { label, className } = verdict(project.safetyScore, t);

  return (
    <section id="safety" className="py-10">
      <div className="mx-auto w-full max-w-[1200px] px-6 max-sm:px-4">
        <Reveal>
          <h2 className="text-2xl font-bold text-foreground">{t("safety.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("safety.subtitle")}
          </p>
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
          <Reveal delay={0.05}>
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-border bg-card p-8">
              <Gauge value={project.safetyScore} />
              <span className={`mt-2 text-base font-semibold ${className}`}>{label}</span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t("safety.garmCategories")}</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {project.safetyCats.map((cat) => (
                  <ScoreBar key={cat.name} label={cat.name} score={cat.score} />
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="mt-4 flex items-start gap-3 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              {t("safety.note")}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
