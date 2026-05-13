'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';

import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';

import { changePassword, type ChangePasswordActionState } from './_actions';

const initialState: ChangePasswordActionState = { ok: true };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-caption text-danger">{message}</p>;
}

export function ChangePasswordForm() {
  const [state, action] = useFormState(changePassword, initialState);

  if (state.done) {
    return (
      <p className="rounded border border-accent/30 bg-accent/10 p-3 text-body text-primary">
        Password updated. You stay logged in on this session.
      </p>
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
        <label
          htmlFor="currentPassword"
          className="mb-1.5 block text-caption uppercase text-tertiary"
        >
          Current password
        </label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(state.fieldErrors?.currentPassword)}
        />
        <FieldError message={state.fieldErrors?.currentPassword} />
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="mb-1.5 block text-caption uppercase text-tertiary"
        >
          New password
        </label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={Boolean(state.fieldErrors?.newPassword)}
        />
        <p className="mt-1 text-caption text-tertiary">At least 8 characters.</p>
        <FieldError message={state.fieldErrors?.newPassword} />
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
        Update password
      </SubmitButton>
    </form>
  );
}
