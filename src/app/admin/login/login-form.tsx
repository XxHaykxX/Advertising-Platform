"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Lock } from "lucide-react";
import { login, type ActionState } from "@/app/admin/actions";
import { PasswordInput } from "@/components/ui/password-input";

export function LoginForm({
  from,
  initialEmail = "",
}: {
  from: string;
  initialEmail?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    login,
    {},
  );

  // Navigate on the client with a fresh full request, so the just-set
  // session cookie is carried and the auth gate sees it (see actions.ts).
  useEffect(() => {
    if (state.ok && state.redirect) {
      window.location.assign(state.redirect);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="from" value={from} />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Email
        </span>
        <input
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="username"
          defaultValue={initialEmail}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary/50"
        />
      </label>

      <label className="block">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Password</span>
          <Link href="/forgot" className="text-xs font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          name="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary/50"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          name="remember"
          type="checkbox"
          defaultChecked={Boolean(initialEmail)}
          className="h-4 w-4 rounded border-border text-primary accent-primary"
        />
        Remember me
      </label>

      {state.error && (
        <p className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm text-primary">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Sign in
          </>
        )}
      </button>
    </form>
  );
}
