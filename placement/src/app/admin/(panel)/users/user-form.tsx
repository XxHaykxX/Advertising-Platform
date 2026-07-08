"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, KeyRound, Ban, RotateCcw, CheckCircle2 } from "lucide-react";
import type { FormState, ResetState } from "./actions";
import { setUserActive, resetUserPassword } from "./actions";

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary";
const labelCls = "mb-1.5 block text-sm font-medium text-foreground";

export function UserForm({
  action,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <label className="block">
          <span className={labelCls}>Email *</span>
          <input name="email" type="email" autoComplete="off" className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>Company name *</span>
          <input name="name" placeholder="Shown on the public portfolio" className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>Password *</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="at least 8 characters"
            className={inputCls}
          />
          <span className="mt-1.5 block text-xs text-muted-foreground">
            Shown only once — hand it off to the publisher yourself.
          </span>
        </label>
      </section>

      {state.error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[--primary-hover] disabled:opacity-70"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Create publisher
        </button>
        <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground">
          Cancel
        </Link>
      </div>
    </form>
  );
}

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
        className={`${inputCls} max-w-[220px] py-1.5`}
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-[--primary-hover] disabled:opacity-70"
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Set password
      </button>
      <button
        type="button"
        onClick={onDone}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        Cancel
      </button>
      {state.error && <span className="text-xs text-danger">{state.error}</span>}
      {state.ok && (
        <span className="inline-flex items-center gap-1 text-xs text-success">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Password updated.
        </span>
      )}
    </form>
  );
}

/** Inline row actions (toggle active / reset password) for the users table.
   Kept inside this file rather than a dedicated component to stay within the
   four files owned by this feature. */
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
          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
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
          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Reset password"
        >
          <KeyRound className="h-4 w-4" />
        </button>
      </div>
      {resetting && <ResetPasswordForm id={id} onDone={() => setResetting(false)} />}
    </div>
  );
}
