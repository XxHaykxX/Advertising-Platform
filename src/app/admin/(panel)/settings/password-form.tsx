"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { changePassword, type ActionState } from "@/app/admin/actions";

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-foreground placeholder:text-white/35 outline-none transition-colors focus:border-primary/50";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    changePassword,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={formAction} className="max-w-md space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-white/80">
          Current password
        </span>
        <input name="current" type="password" autoComplete="current-password" className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-white/80">
          New password
        </span>
        <input name="next" type="password" autoComplete="new-password" placeholder="at least 8 characters" className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-white/80">
          Repeat new password
        </span>
        <input name="confirm" type="password" autoComplete="new-password" className={inputCls} />
      </label>

      {state.error && (
        <p className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm text-primary">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          Password updated.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Change password
      </button>
    </form>
  );
}
