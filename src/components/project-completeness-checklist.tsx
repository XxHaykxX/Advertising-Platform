"use client";

import { Check, Circle } from "lucide-react";
import { makeUI, type Locale } from "@/lib/i18n-client";
import type { CompletenessItem, CompletenessKey } from "@/lib/project-completeness";

// Explicitly "use client" (bundle audit 2026-07-31): its only caller
// (project-form.tsx) recomputes `items` from live client-side form state, so
// it always renders in the browser anyway — marking it avoids it silently
// falling back to server-only i18n imports that would break the moment it's
// rendered from a Client Component.

// Anchors into the project form's own sections (project-form.tsx, `id="sec-…"`
// on each <section>) — a click on an empty item jumps straight there instead
// of leaving the creator to hunt for it in an ~11 000px form. Kept here, not
// in the (form-agnostic) completeness lib, since it's purely a form-layout
// concern.
const ANCHORS: Record<CompletenessKey, string> = {
  tagline: "sec-about",
  studio: "sec-production",
  runtime: "sec-general",
  poster: "sec-media",
  video: "sec-media",
  gallery: "sec-media",
  cast: "sec-cast",
  milestones: "sec-milestones",
  placements: "sec-placements",
  tiers: "sec-tiers",
  references: "sec-references",
  deadline: "sec-production",
  releaseDate: "sec-production",
  platforms: "sec-production",
  cinemas: "sec-production",
  budget: "sec-general",
  ageRating: "sec-general",
};

/** "What a brand sees" — a static snapshot of the SAVED project, not a live
 *  keystroke-by-keystroke indicator (the form itself is largely uncontrolled
 *  via `defaultValue`, so it has no cheap way to know what's currently typed).
 *  It only reflects what's on disk as of the last save, which `hint` below
 *  says outright rather than pretending to be reactive. */
export function ProjectCompletenessChecklist({
  items,
  locale = "en",
}: {
  items: CompletenessItem[];
  locale?: Locale;
}) {
  const t = makeUI(locale);
  const missing = items.filter((item) => !item.filled);

  return (
    <section className="scroll-mt-24 space-y-3 rounded-xl border border-border bg-card p-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
          {t("completeness.title")}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("completeness.hint")}</p>
      </div>

      {missing.length === 0 ? (
        <p className="flex items-center gap-2 text-sm font-medium text-success">
          <Check className="h-4 w-4 shrink-0" />
          {t("completeness.allFilled")}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => {
            const label = t(`completeness.item.${item.key}`);
            const anchor = ANCHORS[item.key];
            return (
              <li key={item.key} className="flex items-center gap-2 text-sm">
                {item.filled ? (
                  <Check className="h-4 w-4 shrink-0 text-success" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                {item.filled ? (
                  <span className="text-foreground">{label}</span>
                ) : anchor ? (
                  <a href={`#${anchor}`} className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
                    {label}
                  </a>
                ) : (
                  <span className="text-muted-foreground">{label}</span>
                )}
                {!item.filled && item.blocksPublish && (
                  <span className="inline-flex items-center rounded-full border border-warn/40 bg-warn/10 px-2 py-0.5 text-xs font-medium text-warn">
                    {t("completeness.blocks")}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
