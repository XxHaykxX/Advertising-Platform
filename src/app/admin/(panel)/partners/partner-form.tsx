"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";
import type { FormState } from "./actions";

export type PartnerInitial = {
  name: string;
  logo: string;
  url: string;
  sortOrder: number;
};

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-foreground placeholder:text-white/35 outline-none transition-colors focus:border-primary/50";
const labelCls = "mb-1.5 block text-sm font-medium text-white/80";

export function PartnerForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial?: PartnerInitial;
  submitLabel: string;
}) {
  const data = initial ?? { name: "", logo: "", url: "", sortOrder: 0 };
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <label className="block">
          <span className={labelCls}>Name *</span>
          <input name="name" defaultValue={data.name} className={inputCls} />
        </label>
        <ImageUpload name="logo" type="partners" defaultValue={data.logo} label="Logo (opt.)" />
        <label className="block">
          <span className={labelCls}>Website URL</span>
          <input name="url" defaultValue={data.url} placeholder="https://..." className={inputCls} />
        </label>
        <label className="block max-w-[200px]">
          <span className={labelCls}>Sort order</span>
          <input name="sortOrder" type="number" defaultValue={data.sortOrder} className={inputCls} />
        </label>
      </section>

      {state.error && (
        <p className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm text-primary">{state.error}</p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-red-600 disabled:opacity-70">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
        <Link href="/admin/partners" className="text-sm text-white/60 hover:text-white">Cancel</Link>
      </div>
    </form>
  );
}
