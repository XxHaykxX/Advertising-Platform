'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';

import { SubmitButton } from '@/components/ui/submit-button';
import { cn } from '@/lib/utils';

import { confirmEnrollment, type EnrollActionState } from './_actions';

const initialState: EnrollActionState = { ok: true };

interface EnrollFormProps {
  secret: string;
}

export function EnrollForm({ secret }: EnrollFormProps) {
  const [state, action] = useFormState(confirmEnrollment, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="secret" value={secret} />

      {state.formError ? (
        <p className="rounded border border-danger/30 bg-danger/10 p-3 text-body text-danger">
          {state.formError}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="code"
          className="mb-2 block text-caption uppercase text-tertiary"
        >
          Code from your authenticator
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
        />
      </div>

      <SubmitButton size="lg" pendingLabel="Confirming…" className="w-full">
        Enable 2FA
      </SubmitButton>
    </form>
  );
}
