'use client';

import * as React from 'react';
import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import {
  resendVerification,
  verifyCode,
  type ResendActionState,
  type VerifyActionState,
} from './_actions';

const RESEND_COOLDOWN = 60;

const verifyInitial: VerifyActionState = { ok: true };
const resendInitial: ResendActionState = { ok: true };

export function VerifyForm({ email }: { email: string }) {
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyCode,
    verifyInitial
  );
  const [resendState, resendAction, resendPending] = useActionState(
    resendVerification,
    resendInitial
  );

  // 60s countdown after page load (initial cooldown) and after each resend.
  const [cooldown, setCooldown] = React.useState(RESEND_COOLDOWN);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // Reset countdown when a resend succeeds; honor server-reported remaining when throttled.
  React.useEffect(() => {
    if (resendState.ok && resendState.message) setCooldown(RESEND_COOLDOWN);
    if (!resendState.ok && resendState.cooldownSecondsRemaining) {
      setCooldown(resendState.cooldownSecondsRemaining);
    }
  }, [resendState]);

  return (
    <div className="flex flex-col gap-6">
      <form action={verifyAction} className="flex flex-col gap-4">
        <input type="hidden" name="email" value={email} />
        <div>
          <label
            htmlFor="code"
            className="mb-2 block text-caption uppercase text-tertiary"
          >
            6-digit code
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            pattern="\d{6}"
            required
            autoFocus
            className={cn(
              'h-14 w-full rounded border border-border-subtle bg-surface text-center',
              'text-display-lg font-medium tracking-[0.5em] text-primary',
              'transition-colors duration-200 ease-out-expo',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:border-border-strong'
            )}
            aria-invalid={Boolean(verifyState.error)}
          />
          {verifyState.error ? (
            <p className="mt-2 text-caption text-danger">{verifyState.error}</p>
          ) : null}
        </div>

        <Button type="submit" size="lg" disabled={verifyPending} className="w-full">
          {verifyPending ? 'Verifying…' : 'Verify email'}
        </Button>
      </form>

      <form action={resendAction} className="flex flex-col gap-2">
        <input type="hidden" name="email" value={email} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={resendPending || cooldown > 0}
          className="w-full"
        >
          {resendPending
            ? 'Sending…'
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : 'Resend code'}
        </Button>
        {resendState.message ? (
          <p
            className={cn(
              'text-center text-caption',
              resendState.ok ? 'text-secondary' : 'text-danger'
            )}
          >
            {resendState.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
