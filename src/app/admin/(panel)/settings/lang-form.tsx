"use client";

import { useActionState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { saveDefaultLang, type SaveLangState } from "./lang-actions";

const selectCls =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/50";

const LANG_OPTIONS = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "hy", label: "Հայերեն" },
] as const;

export function LangForm({ current }: { current: string }) {
  const [state, formAction, pending] = useActionState<SaveLangState, FormData>(
    saveDefaultLang,
    {},
  );

  return (
    <form action={formAction} className="max-w-xs space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-white/80">
          Default site language
        </span>
        <select name="default_lang" defaultValue={current} className={selectCls}>
          {LANG_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {state.error && (
        <p className="text-sm text-primary">{state.error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-red-600 disabled:opacity-70"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save
        </button>
        {state.ok && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
