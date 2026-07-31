"use client";

import { Check, Circle } from "lucide-react";
import { makeUI, type Locale } from "@/lib/i18n-client";
import { flashField } from "@/lib/field-flash";
import type { CompletenessItem, CompletenessKey } from "@/lib/project-completeness";

// Explicitly "use client" (bundle audit 2026-07-31): its only caller
// (project-form.tsx) recomputes `items` from live client-side form state, so
// it always renders in the browser anyway — marking it avoids it silently
// falling back to server-only i18n imports that would break the moment it's
// rendered from a Client Component.

// Anchors into the project form (project-form.tsx) — a click on an empty item
// jumps straight there instead of leaving the creator to hunt for it in an
// ~11 000px form. Kept here, not in the (form-agnostic) completeness lib, since
// it's purely a form-layout concern.
//
// These point at individual fields (`id="field-…"`, set via Field/MediaCard's
// anchorId) wherever one exists. They used to point at the enclosing
// `id="sec-…"` section, which was not enough: General holds ~8 fields, so
// landing on the section still left "which one is empty?" unanswered — the
// owner reported exactly that on 2026-07-31. The remaining section-level
// targets are sections that hold a single editor, where the section IS the
// field. Whatever the target, flashField() marks it for a couple of seconds
// after the scroll settles.
const ANCHORS: Record<CompletenessKey, string> = {
  // The three About fields live behind per-locale tabs, so a per-field anchor
  // would be missing from the DOM whenever another tab is open. The section
  // holds three fields — close enough to read at a glance.
  tagline: "sec-about",
  studio: "field-studio",
  runtime: "field-runtime",
  poster: "field-poster",
  video: "field-video",
  gallery: "field-gallery",
  cast: "sec-cast",
  milestones: "sec-milestones",
  placements: "sec-placements",
  tiers: "sec-tiers",
  references: "sec-references",
  deadline: "field-deadline",
  releaseDate: "field-releaseDate",
  platforms: "field-platforms",
  cinemas: "field-cinemas",
  budget: "field-budget",
  ageRating: "field-ageRating",
  formatCategory: "field-formatCategory",
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
                  <a
                    href={`#${anchor}`}
                    // Still a real href — middle-click, keyboard and "copy link
                    // location" keep working, and it degrades to a plain jump
                    // if the JS below never runs. The handler only takes over
                    // to add the flash (and to avoid leaving #field-… in the
                    // address bar, which would re-fire on reload).
                    onClick={(e) => {
                      e.preventDefault();
                      flashField(anchor);
                    }}
                    className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
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
