'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import Link from 'next/link';

import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { cn } from '@/lib/utils';

import { registerUser, type RegisterActionState } from '../_actions';

const initialState: RegisterActionState = { ok: true };

interface PersonalFormProps {
  role: 'advertiser' | 'publisher';
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-caption text-danger">{message}</p>;
}

export function PersonalForm({ role }: PersonalFormProps) {
  const [rawState, action] = useFormState(registerUser, initialState);
  const state = rawState ?? initialState;

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="role" value={role} />

      {state.formError ? (
        <p className="rounded border border-danger/30 bg-danger/10 p-3 text-body text-danger">
          {state.formError}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="name"
          className="mb-1.5 block text-caption uppercase text-tertiary"
        >
          Full name
        </label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          required
          aria-invalid={Boolean(state.fieldErrors?.name)}
          aria-describedby={state.fieldErrors?.name ? 'name-error' : undefined}
        />
        <FieldError message={state.fieldErrors?.name} />
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-caption uppercase text-tertiary"
        >
          Work email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(state.fieldErrors?.email)}
        />
        <FieldError message={state.fieldErrors?.email} />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="mb-1.5 block text-caption uppercase text-tertiary"
        >
          Phone
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+374 …"
          required
          aria-invalid={Boolean(state.fieldErrors?.phone)}
        />
        <FieldError message={state.fieldErrors?.phone} />
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
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
        <p className="mt-1 text-caption text-tertiary">At least 8 characters.</p>
        <FieldError message={state.fieldErrors?.password} />
      </div>

      <label
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded border border-border-subtle bg-surface p-3',
          'transition-colors duration-200 ease-out-expo hover:border-border-strong'
        )}
      >
        <input
          type="checkbox"
          name="acceptTerms"
          required
          className="mt-1 h-4 w-4 accent-accent"
        />
        <span className="text-body text-secondary">
          I accept the{' '}
          <Link href="/terms" className="text-primary underline-offset-4 hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-primary underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      <FieldError message={state.fieldErrors?.acceptTerms} />

      <SubmitButton size="lg" pendingLabel="Creating account…" className="w-full">
        Create account
      </SubmitButton>

      <p className="text-center text-body text-secondary">
        Already have an account?{' '}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
