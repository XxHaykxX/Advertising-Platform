"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { PortfolioFormState, PortfolioFormValues } from "./actions";

export type PortfolioFormInitial = PortfolioFormValues;

const EMPTY: PortfolioFormInitial = {
  title: "",
  brand: "",
  description: "",
  image: "",
  metrics: "",
  sortOrder: 0,
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

  return (
    <form action={formAction} className="max-w-2xl space-y-8">
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">Case study</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title *">
            <input name="title" defaultValue={data.title} required className={inputCls} />
          </Field>
          <Field label="Brand *">
            <input name="brand" defaultValue={data.brand} required className={inputCls} />
          </Field>
        </div>
        <Field label="Description *">
          <textarea
            name="description"
            defaultValue={data.description}
            rows={4}
            className={`${inputCls} resize-none`}
          />
        </Field>
        <Field label="Image URL">
          <input name="image" defaultValue={data.image} placeholder="https://…" className={inputCls} />
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
