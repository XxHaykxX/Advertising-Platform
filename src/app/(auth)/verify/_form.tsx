'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';

import { SubmitButton } from '@/components/ui/submit-button';
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
  const [verifyState, verifyAction] = useFormState(verifyCode, verifyInitial);
  const [resendState, resendAction] = useFormState(resendVerification, resendInitial);

  // 60s countdown after page load and after each resend.
  const [cooldown, setCooldown] = React.useState(RESEND_COOLDOWN);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

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

        <SubmitButton size="lg" pendingLabel="Verifying…" className="w-full">
          Verify email
        </SubmitButton>
      </form>

      <form action={resendAction} className="flex flex-col gap-2">
        <input type="hidden" name="email" value={email} />
        <SubmitButton
          variant="ghost"
          size="sm"
          disabled={cooldown > 0}
          pendingLabel="Sending…"
          className="w-full"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </SubmitButton>
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
