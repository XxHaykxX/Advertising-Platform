"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2, KeyRound, Ban, RotateCcw, CheckCircle2 } from "lucide-react";
import { setUserActive, resetUserPassword, type ResetState } from "./actions";

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-foreground placeholder:text-white/35 outline-none transition-colors focus:border-primary/50";

function ResetPasswordForm({ id, onDone }: { id: number; onDone: () => void }) {
  const action = resetUserPassword.bind(null, id);
  const [state, formAction, pending] = useActionState<ResetState, FormData>(action, {});

  return (
    <form action={formAction} className="mt-2 flex flex-wrap items-center gap-2">
      <input
        name="password"
        type="password"
        placeholder="New password (min. 8 chars)"
        autoComplete="new-password"
        className={`${inputCls} max-w-[220px]`}
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-red-600 disabled:opacity-70"
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Set password
      </button>
      <button
        type="button"
        onClick={onDone}
        className="text-xs text-white/50 hover:text-white"
      >
        Cancel
      </button>
      {state.error && <span className="text-xs text-primary">{state.error}</span>}
      {state.ok && (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Password updated.
        </span>
      )}
    </form>
  );
}

export function RowActions({
  id,
  isActive,
  isSelf,
}: {
  id: number;
  isActive: boolean;
  isSelf: boolean;
}) {
  const [pending, start] = useTransition();
  const [resetting, setResetting] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={pending || (isSelf && isActive)}
          title={isSelf && isActive ? "You can't deactivate your own account" : undefined}
          onClick={() => start(() => setUserActive(id, !isActive))}
          className="grid h-8 w-8 place-items-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={isActive ? "Deactivate" : "Reactivate"}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isActive ? (
            <Ban className="h-4 w-4" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setResetting((v) => !v)}
          className="grid h-8 w-8 place-items-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white"
          aria-label="Reset password"
        >
          <KeyRound className="h-4 w-4" />
        </button>
      </div>
      {resetting && <ResetPasswordForm id={id} onDone={() => setResetting(false)} />}
    </div>
  );
}
