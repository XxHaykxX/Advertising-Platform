'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import Link from 'next/link';

import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';

import { resetPassword, type ResetActionState } from '../forgot-password/_actions';

const initialState: ResetActionState = { ok: true };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-caption text-danger">{message}</p>;
}

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useFormState(resetPassword, initialState);

  if (state.done) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded border border-accent/30 bg-accent/10 p-3 text-body text-primary">
          Password updated. You can log in with your new password.
        </p>
        <Link
          href="/login"
          className="inline-flex h-12 items-center justify-center rounded bg-accent px-6 text-body-lg font-medium text-accent-on hover:bg-accent/90"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />

      {state.formError ? (
        <p className="rounded border border-danger/30 bg-danger/10 p-3 text-body text-danger">
          {state.formError}
        </p>
      ) : null}

      <div>
        <label htmlFor="password" className="mb-1.5 block text-caption uppercase text-tertiary">
          New password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
        <p className="mt-1 text-caption text-tertiary">At least 8 characters.</p>
        <FieldError message={state.fieldErrors?.password} />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-1.5 block text-caption uppercase text-tertiary"
        >
          Confirm new password
        </label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
        />
        <FieldError message={state.fieldErrors?.confirmPassword} />
      </div>

      <SubmitButton size="lg" pendingLabel="Updating…" className="w-full">
        Set new password
      </SubmitButton>
    </form>
  );
}
