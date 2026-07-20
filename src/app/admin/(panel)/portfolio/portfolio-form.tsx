"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Languages, Loader2 } from "lucide-react";
import { makeUI } from "@/lib/i18n";
import { MediaField } from "@/components/media-field";
import type { PortfolioFormState, PortfolioFormValues } from "./actions";
import { translatePortfolioAction, type TranslatePortfolioState } from "./translate-action";

export type PortfolioFormInitial = PortfolioFormValues;

type TranslateLang = "hy" | "ru" | "en";

// Admin chrome is English-only (same as project-form) — used purely for the
// shared translate.* error strings surfaced by the Translate button.
const t = makeUI("en");

const EMPTY: PortfolioFormInitial = {
  title: "",
  description: "",
  brand: "",
  image: "",
  metrics: "",
  sortOrder: 0,
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

        {/* ── Title (per-locale) ── */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Title (HY) *">
            <input ref={titleRefs.hy} name="titleHy" defaultValue={data.titleHy} placeholder="Վերնագիր հայերեն" className={inputCls} />
          </Field>
          <Field label="Title (RU) *">
            <input ref={titleRefs.ru} name="titleRu" defaultValue={data.titleRu} placeholder="Название по-русски" className={inputCls} />
          </Field>
          <Field label="Title (EN) *">
            <input ref={titleRefs.en} name="titleEn" defaultValue={data.titleEn} placeholder="Title in English" className={inputCls} />
          </Field>
        </div>

        {/* ── Description (per-locale) ── */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Description (HY) *">
            <textarea
              ref={descriptionRefs.hy}
              name="descriptionHy"
              defaultValue={data.descriptionHy}
              rows={4}
              placeholder="Նկարագրություն հայերեն"
              className={`${inputCls} resize-none`}
            />
          </Field>
          <Field label="Description (RU) *">
            <textarea
              ref={descriptionRefs.ru}
              name="descriptionRu"
              defaultValue={data.descriptionRu}
              rows={4}
              placeholder="Описание по-русски"
              className={`${inputCls} resize-none`}
            />
          </Field>
          <Field label="Description (EN) *">
            <textarea
              ref={descriptionRefs.en}
              name="descriptionEn"
              defaultValue={data.descriptionEn}
              rows={4}
              placeholder="Description in English"
              className={`${inputCls} resize-none`}
            />
          </Field>
        </div>

        <Field label="Image">
          <MediaField name="image" initial={data.image} uploadDir="portfolio" />
        </Field>
        <Field label="Metrics (JSON)">
          <textarea
            name="metrics"
            defaultValue={data.metrics}
            rows={3}
            placeholder={'{"views":"2.1M","recall":"+38%"}'}
            className={`${inputCls} resize-none font-mono`}
          />
        </Field>
        <Field label="Sort order">
          <input name="sortOrder" type="number" defaultValue={data.sortOrder} className={inputCls} />
        </Field>
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
