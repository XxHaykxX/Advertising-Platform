"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { PartnerFormState, PartnerFormValues } from "./actions";

export type PartnerFormInitial = PartnerFormValues;

const EMPTY: PartnerFormInitial = {
  name: "",
  logo: "",
  url: "",
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

export function PartnerForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: PartnerFormState, fd: FormData) => Promise<PartnerFormState>;
  initial?: PartnerFormInitial;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<PartnerFormState, FormData>(action, {});

  // On a failed submit (validation error), the server echoes back exactly
  // what the user typed in state.values — so re-rendering the form never
  // wipes the fields. Edit mode preboots from `initial`, create mode from
  // `EMPTY`; a returned `state.values` always wins once present.
  const data: PartnerFormInitial = state.values ?? initial ?? EMPTY;

  return (
    <form action={formAction} className="max-w-xl space-y-8">
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">Partner</h2>
        <Field label="Name *">
          <input name="name" defaultValue={data.name} className={inputCls} />
        </Field>
        <Field label="Logo URL">
          <input name="logo" defaultValue={data.logo} placeholder="https://…" className={inputCls} />
        </Field>
        <Field label="Website URL">
          <input name="url" defaultValue={data.url} placeholder="https://…" className={inputCls} />
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
        <Link href="/admin/partners" className="text-sm text-muted-foreground hover:text-foreground">
          Cancel
        </Link>
      </div>
    </form>
  );
}
