"use client";

import { useActionState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { CONTENT_GROUPS } from "@/lib/content-keys";
import { saveContent, type SaveState } from "./actions";

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/50";

type Rows = Record<string, { ru: string; en: string; hy: string }>;

export function ContentForm({ rows }: { rows: Rows }) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    saveContent,
    {},
  );

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      {CONTENT_GROUPS.map((group) => (
        <section key={group.group} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            {group.group}
          </h2>
          <div className="space-y-5">
            {group.items.map((item) => {
              const v = rows[item.key] ?? { ru: "", en: "", hy: "" };
              const ruVal = v.ru || item.ru;
              const enVal = v.en || item.en;
              const hyVal = v.hy || item.hy;
              return (
                <div key={item.key}>
                  <span className="mb-1.5 block text-sm font-medium text-white/80">
                    {item.label}
                  </span>
                  {item.multiline ? (
                    <textarea name={`ru:${item.key}`} defaultValue={ruVal} rows={2} className={`${inputCls} resize-none`} />
                  ) : (
                    <input name={`ru:${item.key}`} defaultValue={ruVal} className={inputCls} />
                  )}
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-white/45">EN / HY</summary>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <input name={`en:${item.key}`} defaultValue={enVal} placeholder="EN" className={inputCls} />
                      <input name={`hy:${item.key}`} defaultValue={hyVal} placeholder="HY" className={inputCls} />
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="sticky bottom-4 flex items-center gap-3 rounded-xl border border-white/10 bg-[#0e0e0e]/90 p-3 backdrop-blur">
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-red-600 disabled:opacity-70">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Сохранить тексты
        </button>
        {state.ok && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Сохранено
          </span>
        )}
      </div>
    </form>
  );
}
