import { Reveal } from "@/components/ui/reveal";
import { CastCarousel } from "@/components/report/cast-carousel";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import type { ProjectDetailDTO } from "@/lib/types";

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
          <div className="mt-6">
            <CastCarousel
              actors={project.actors}
              prevLabel={t("report.prev")}
              nextLabel={t("report.next")}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
