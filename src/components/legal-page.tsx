import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export type LegalSection = { heading: string; body: string[] };

export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <main className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[60%] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
      <article className="relative z-10 mx-auto max-w-3xl px-6 pb-24 pt-32">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          На главную
        </Link>

        <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-white/40">Обновлено: {updated}</p>
        <p className="mt-6 text-base leading-relaxed text-white/70">{intro}</p>

        <div className="mt-10 space-y-8">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-lg font-bold text-foreground">
                {i + 1}. {s.heading}
              </h2>
              {s.body.map((p, j) => (
                <p key={j} className="mt-3 text-sm leading-relaxed text-white/65">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        <p className="mt-12 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/40">
          Это типовой шаблон. Перед публикацией замените реквизитами компании и
          согласуйте с юристом.
        </p>
      </article>
    </main>
  );
}
