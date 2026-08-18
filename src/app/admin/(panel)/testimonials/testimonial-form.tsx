"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Languages, Loader2 } from "lucide-react";
import { useUI } from "@/lib/i18n-client";
import { MediaField } from "@/components/media-field";
import type { TestimonialFormState, TestimonialFormValues } from "./actions";
import { translateTestimonialAction, type TranslateTestimonialState } from "./translate-action";

export type TestimonialFormInitial = TestimonialFormValues;

type Lang = "hy" | "ru" | "en";

// Locale tabs, same pattern as ../portfolio/portfolio-form.tsx's About block:
// all three panels stay mounted, the inactive ones are just `hidden`.
const LANGS = ["hy", "ru", "en"] as const;
const LANG_NAMES: Record<Lang, string> = { hy: "Հայերեն", ru: "Русский", en: "English" };

const EMPTY: TestimonialFormInitial = {
  video: "",
  image: "",
  avatar: "",
  authorName: "",
  authorRole: "",
  company: "",
  quoteHy: "",
  quoteRu: "",
  quoteEn: "",
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

export function TestimonialForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: TestimonialFormState, fd: FormData) => Promise<TestimonialFormState>;
  initial?: TestimonialFormInitial;
  submitLabel: string;
}) {
  // Admin chrome is English-only (same as portfolio-form) — used purely for
  // the shared translate.* error strings surfaced by the Translate button.
  const t = useUI("en");
  const [state, formAction, pending] = useActionState<TestimonialFormState, FormData>(action, {});

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
  const data: TestimonialFormInitial = state.values ?? initial ?? EMPTY;

  const initialFilled = (() => {
    const filled = new Set<Lang>();
    for (const l of LANGS) {
      const quote = l === "hy" ? data.quoteHy : l === "ru" ? data.quoteRu : data.quoteEn;
      if ((quote || "").trim()) filled.add(l);
    }
    return filled;
  })();
  // Open on a language that actually has text — landing on an empty Armenian
  // panel for a quote written only in English reads as "the quote is blank".
  const [tab, setTab] = useState<Lang>(LANGS.find((l) => initialFilled.has(l)) ?? "hy");
  const [filledLangs, setFilledLangs] = useState<Set<Lang>>(initialFilled);

  function markFilled(lang: Lang, value: string) {
    setFilledLangs((prev) => {
      const next = new Set(prev);
      if (value.trim()) next.add(lang);
      else next.delete(lang);
      return next;
    });
  }

  // ── Translate: hy/ru/en quote refs are plain uncontrolled fields
  // (defaultValue), so the "Translate" button fills the other two languages by
  // writing straight into the DOM via refs — no controlled state needed, same
  // approach as portfolio-form. Reuses the shared translateFields engine via
  // translateTestimonialAction (quote rides the synopsis slot).
  const quoteRefs: Record<Lang, React.RefObject<HTMLTextAreaElement | null>> = {
    hy: useRef<HTMLTextAreaElement>(null),
    ru: useRef<HTMLTextAreaElement>(null),
    en: useRef<HTMLTextAreaElement>(null),
  };
  const [translating, startTranslate] = useTransition();
  const [translateError, setTranslateError] = useState<NonNullable<TranslateTestimonialState["errorCode"]> | null>(null);

  function handleTranslate() {
    setTranslateError(null);
    // Source = whichever quote field is already filled (ru first).
    const langPriority: Lang[] = ["ru", "hy", "en"];
    const hit = langPriority.find((l) => (quoteRefs[l].current?.value || "").trim());
    if (!hit) {
      setTranslateError("emptyFields");
      return;
    }
    const fd = new FormData();
    fd.set("sourceLang", hit);
    fd.set("quote", quoteRefs[hit].current?.value || "");

    startTranslate(async () => {
      const res = await translateTestimonialAction(fd);
      if (res.errorCode) {
        setTranslateError(res.errorCode);
        return;
      }
      for (const [lang, value] of Object.entries(res.values || {})) {
        const l = lang as Lang;
        if (quoteRefs[l]?.current) quoteRefs[l].current!.value = value.quote;
        markFilled(l, value.quote);
      }
    });
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-8">
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">Author</h2>
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

        <Field label="Author name *">
          <input name="authorName" defaultValue={data.authorName} required className={inputCls} />
        </Field>
        <Field label="Role">
          <input name="authorRole" defaultValue={data.authorRole} className={inputCls} />
        </Field>
        <Field label="Company">
          <input name="company" defaultValue={data.company} className={inputCls} />
        </Field>
        <Field label="Avatar">
          <MediaField name="avatar" initial={data.avatar} uploadDir="testimonials" />
        </Field>

        {/* Language switcher — one panel per locale instead of three quote
            boxes stacked at full width. Same pattern as portfolio-form. */}
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
          const quoteValue = l === "hy" ? data.quoteHy : l === "ru" ? data.quoteRu : data.quoteEn;
          return (
            <div key={l} className={tab === l ? "space-y-4" : "hidden"}>
              {/* Not `required`: a field on a hidden tab can't be focused for
                  native validation, which would block submit with no visible
                  reason. The server checks that at least one locale is filled. */}
              <Field label="Quote">
                <textarea
                  ref={quoteRefs[l]}
                  name={`quote${suffix}`}
                  defaultValue={quoteValue}
                  onChange={(e) => markFilled(l, e.target.value)}
                  rows={5}
                  placeholder={l === "hy" ? "Մեջբերում" : l === "ru" ? "Цитата" : "Quote"}
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </div>
          );
        })}
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">Media</h2>
        <Field label="Poster / fallback still">
          <MediaField name="image" initial={data.image} uploadDir="testimonials" />
        </Field>
        {/* Optional: the homepage carousel plays this instead of the still,
            with the image above as its poster. */}
        <Field label="Video (optional)">
          <MediaField name="video" initial={data.video} uploadDir="testimonials" accept="video" />
        </Field>
        {/* Sort order is not a field — the list page orders testimonials by
            drag-and-drop, same as Portfolio. New rows go to the end; the
            server assigns the position. */}
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
        <Link href="/admin/testimonials" className="text-sm text-muted-foreground hover:text-foreground">
          Cancel
        </Link>
      </div>
    </form>
  );
}
