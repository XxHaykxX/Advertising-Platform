import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";

export type LegalSection = { heading: string; body: string[] };

export function LegalPage({
  updated,
  intro,
  sections,
  locale = DEFAULT_LOCALE,
}: {
  updated: string;
  intro: string;
  sections: LegalSection[];
  locale?: Locale;
}) {
  const t = makeUI(locale);
  return (
    <main className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[60%] -translate-x-1/2 rounded-full bg-primary/5 blur-[140px]" />
      <Container className="relative z-10 pb-24 pt-16">
        <article className="max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("legal.backToHome")}
          </Link>

          <p className="mt-8 text-sm text-muted-foreground">{t("legal.updated")} {updated}</p>
          <p className="mt-6 text-base leading-relaxed text-foreground">{intro}</p>

          <div className="mt-10 space-y-8">
            {sections.map((s, i) => (
              <section key={i}>
                <h2 className="text-lg font-bold text-foreground">
                  {i + 1}. {s.heading}
                </h2>
                {s.body.map((p, j) => (
                  <p key={j} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <p className="mt-12 rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
            {t("legal.effectiveNotice")}
          </p>
        </article>
      </Container>
    </main>
  );
}
