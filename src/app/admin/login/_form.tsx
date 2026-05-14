'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';

import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';

import { adminLogin, type AdminLoginActionState } from './_actions';

const initialState: AdminLoginActionState = { ok: true };

export function AdminLoginForm() {
  const [state, action] = useFormState(adminLogin, initialState);

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.formError ? (
        <p className="rounded border border-danger/30 bg-danger/10 p-3 text-body text-danger">
          {state.formError}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-caption uppercase text-tertiary"
        >
          Email
        </label>
        <Input id="email" name="email" type="email" autoComplete="email" autoFocus required />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-caption uppercase text-tertiary"
        >
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <SubmitButton size="lg" pendingLabel="Logging in…" className="w-full">
        Continue
      </SubmitButton>
    </form>
  );
}
