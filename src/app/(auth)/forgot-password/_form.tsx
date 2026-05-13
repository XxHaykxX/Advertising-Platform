'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import Link from 'next/link';

import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';

import { requestPasswordReset, type ForgotActionState } from './_actions';

const initialState: ForgotActionState = { ok: true };

export function ForgotForm() {
  const [state, action] = useFormState(requestPasswordReset, initialState);

  if (state.ok && state.message) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded border border-accent/30 bg-accent/10 p-3 text-body text-primary">
          {state.message}
        </p>
        <p className="text-body text-secondary">
          Didn&apos;t get it? Check your spam folder, or{' '}
          <Link href="/forgot-password" className="text-primary underline-offset-4 hover:underline">
            try again
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.formError ? (
        <p className="rounded border border-danger/30 bg-danger/10 p-3 text-body text-danger">
          {state.formError}
        </p>
      ) : null}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-caption uppercase text-tertiary">
          Email
        </label>
        <Input id="email" name="email" type="email" autoComplete="email" autoFocus required />
      </div>

      <SubmitButton size="lg" pendingLabel="Sending…" className="w-full">
        Send reset link
      </SubmitButton>

      <p className="text-center text-body text-secondary">
        Remembered it?{' '}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
