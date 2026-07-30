"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Languages, Loader2 } from "lucide-react";
import { makeUI } from "@/lib/i18n";
import { MediaField } from "@/components/media-field";
import { MetricsEditor } from "./metrics-editor";
import type { PortfolioFormState, PortfolioFormValues } from "./actions";
import { translatePortfolioAction, type TranslatePortfolioState } from "./translate-action";

export type PortfolioFormInitial = PortfolioFormValues;

type TranslateLang = "hy" | "ru" | "en";

// Admin chrome is English-only (same as project-form) — used purely for the
// shared translate.* error strings surfaced by the Translate button.
const t = makeUI("en");

// Locale tabs, same pattern (and same reasoning) as the project form's About
// block: all three panels stay mounted, the inactive ones are just `hidden`, so
// the uncontrolled refs and the Translate button keep working untouched.
const LANGS = ["hy", "ru", "en"] as const;
const LANG_NAMES: Record<TranslateLang, string> = { hy: "Հայերեն", ru: "Русский", en: "English" };

const EMPTY: PortfolioFormInitial = {
  title: "",
  description: "",
  brand: "",
  image: "",
  metrics: "",
  titleHy: "",
  titleRu: "",
  titleEn: "",
  descriptionHy: "",
  descriptionRu: "",
  descriptionEn: "",
};

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary";
const labelCls = "mb-1.5 block text-sm font-medium text-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

export function PortfolioForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: PortfolioFormState, fd: FormData) => Promise<PortfolioFormState>;
  initial?: PortfolioFormInitial;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<PortfolioFormState, FormData>(action, {});

  // Full page load rather than the client router — see the redirect-contract
  // comment in ../partners/actions.ts. Depends on `state`, not state.ok: two
  // successful saves in a row read identically (the IA-15 trap).
  useEffect(() => {
    if (state.ok && state.redirect) window.location.assign(state.redirect);
  }, [state]);

  // On a failed submit (validation error), the server echoes back exactly
  // what the user typed in state.values — so re-rendering the form never
  // wipes the fields. Edit mode preboots from `initial`, create mode from
  // `EMPTY`; a returned `state.values` always wins once present.
  const data: PortfolioFormInitial = state.values ?? initial ?? EMPTY;

  // ── Translate (#41): hy/ru/en refs are plain uncontrolled fields
  // (defaultValue), so the "Translate" button fills the other two languages by
  // writing straight into the DOM via refs — no controlled state needed, same
  // approach as project-form. Reuses the shared translateFields engine via
  // translatePortfolioAction (description rides the synopsis slot).
  const titleRefs: Record<TranslateLang, React.RefObject<HTMLInputElement | null>> = {
    hy: useRef<HTMLInputElement>(null),
    ru: useRef<HTMLInputElement>(null),
    en: useRef<HTMLInputElement>(null),
  };
  const descriptionRefs: Record<TranslateLang, React.RefObject<HTMLTextAreaElement | null>> = {
    hy: useRef<HTMLTextAreaElement>(null),
    ru: useRef<HTMLTextAreaElement>(null),
    en: useRef<HTMLTextAreaElement>(null),
  };
  const [translating, startTranslate] = useTransition();
  const [translateError, setTranslateError] = useState<NonNullable<TranslatePortfolioState["errorCode"]> | null>(null);

  // Which locale panel is showing, and which locales carry text — the dot on a
  // tab is the only way to see that a language is still empty once the fields
  // are behind tabs instead of side by side.
  const initialFilled = (() => {
    const filled = new Set<TranslateLang>();
    for (const l of LANGS) {
      const title = l === "hy" ? data.titleHy : l === "ru" ? data.titleRu : data.titleEn;
      const desc = l === "hy" ? data.descriptionHy : l === "ru" ? data.descriptionRu : data.descriptionEn;
      if ((title || "").trim() || (desc || "").trim()) filled.add(l);
    }
    return filled;
  })();
  // Open on a language that actually has text — landing on an empty Armenian
  // panel for a case written only in English reads as "the case is blank".
  const [tab, setTab] = useState<TranslateLang>(LANGS.find((l) => initialFilled.has(l)) ?? "hy");
  const [filledLangs, setFilledLangs] = useState<Set<TranslateLang>>(initialFilled);

  /** Recompute the tab dots from what the (uncontrolled) fields hold right now —
   *  cheap enough to run per keystroke and keeps Translate's DOM writes honest
   *  once the button re-reads them. */
  function markFilled() {
    const filled = new Set<TranslateLang>();
    for (const l of LANGS) {
      if ((titleRefs[l].current?.value || "").trim() || (descriptionRefs[l].current?.value || "").trim()) {
        filled.add(l);
      }
    }
    setFilledLangs(filled);
  }

  function handleTranslate() {
    setTranslateError(null);
    // Source = whichever per-locale title field is already filled (ru first).
    const langPriority: TranslateLang[] = ["ru", "hy", "en"];
    const hit = langPriority.find((l) => (titleRefs[l].current?.value || "").trim());
    if (!hit) {
      setTranslateError("emptyFields");
      return;
    }
    const fd = new FormData();
    fd.set("sourceLang", hit);
    fd.set("title", titleRefs[hit].current?.value || "");
    fd.set("description", descriptionRefs[hit].current?.value || "");

    startTranslate(async () => {
      const res = await translatePortfolioAction(fd);
      if (res.errorCode) {
        setTranslateError(res.errorCode);
        return;
      }
      for (const [lang, value] of Object.entries(res.values || {})) {
        const l = lang as TranslateLang;
        if (titleRefs[l]?.current) titleRefs[l].current!.value = value.title;
        if (descriptionRefs[l]?.current) descriptionRefs[l].current!.value = value.description;
      }
      markFilled();
    });
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-8">
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">Case study</h2>
          <button
            type="button"
            onClick={handleTranslate}
            disabled={translating}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary disabled:opacity-60"
          >
            {translating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
            {translating ? t("translate.working") : t("btn.translate")}
          </button>
        </div>
        {translateError && (
          <p className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
            {t("translate.error")}: {t(`translate.${translateError}`)}
          </p>
        )}

        <Field label="Brand *">
          <input name="brand" defaultValue={data.brand} required className={inputCls} />
        </Field>

        {/* Language switcher — one panel per locale instead of three columns of
            every field, which pushed the description boxes down to a third of
            the width each. */}
        <div className="flex gap-1 rounded-xl border border-border bg-background p-1">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setTab(l)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {LANG_NAMES[l]}
              {filledLangs.has(l) && <span className="ml-1.5 text-xs opacity-70">●</span>}
            </button>
          ))}
        </div>

        {LANGS.map((l) => {
          const suffix = l === "hy" ? "Hy" : l === "ru" ? "Ru" : "En";
          const titleValue = l === "hy" ? data.titleHy : l === "ru" ? data.titleRu : data.titleEn;
          const descValue =
            l === "hy" ? data.descriptionHy : l === "ru" ? data.descriptionRu : data.descriptionEn;
          return (
            <div key={l} className={tab === l ? "space-y-4" : "hidden"}>
              {/* Not `required`: a field on a hidden tab can't be focused for
                  native validation, which would block submit with no visible
                  reason. The server checks that at least one locale is filled. */}
              <Field label="Title">
                <input
                  ref={titleRefs[l]}
                  name={`title${suffix}`}
                  defaultValue={titleValue}
                  onChange={markFilled}
                  placeholder={l === "hy" ? "Վերնագիր" : l === "ru" ? "Название" : "Title"}
                  className={inputCls}
                />
              </Field>
              <Field label="Description">
                <textarea
                  ref={descriptionRefs[l]}
                  name={`description${suffix}`}
                  defaultValue={descValue}
                  onChange={markFilled}
                  rows={6}
                  placeholder={l === "hy" ? "Նկարագրություն" : l === "ru" ? "Описание" : "Description"}
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </div>
          );
        })}
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">Media & results</h2>
        <Field label="Image">
          <MediaField name="image" initial={data.image} uploadDir="portfolio" />
        </Field>
        <Field label="Metrics">
          <MetricsEditor name="metrics" initial={data.metrics} />
        </Field>
        {/* Sort order is not a field any more — the list page orders cases by
            drag-and-drop (2026-07-27), same as Projects. New cases go to the
            end; the server assigns the position. */}
      </section>

      {state.error && (
        <p className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm text-primary">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-70"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
        <Link href="/admin/portfolio" className="text-sm text-muted-foreground hover:text-foreground">
          Cancel
        </Link>
      </div>
    </form>
  );
}
