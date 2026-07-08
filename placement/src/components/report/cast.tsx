import { Reveal } from "@/components/ui/reveal";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import type { ActorDTO, ProjectDetailDTO } from "@/lib/types";

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function ActorCard({ actor }: { actor: ActorDTO }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ background: "var(--grad)" }}
        aria-hidden
      >
        {initials(actor.name)}
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-foreground">{actor.name}</p>
        <p className="truncate text-xs text-muted-foreground">{actor.role}</p>
      </div>
    </div>
  );
}

export function Cast({
  project,
  locale = DEFAULT_LOCALE,
}: {
  project: ProjectDetailDTO;
  locale?: Locale;
}) {
  if (project.actors.length === 0) return null;
  const t = makeUI(locale);

  return (
    <section id="cast" className="py-10">
      <div className="mx-auto w-full max-w-[1200px] px-6 max-sm:px-4">
        <Reveal>
          <h2 className="text-2xl font-bold text-foreground">{t("cast.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("cast.subtitle")}
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {project.actors.map((actor) => (
              <ActorCard key={actor.id} actor={actor} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
