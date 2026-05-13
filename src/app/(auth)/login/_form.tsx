'use client';

import * as React from 'react';
import { useActionState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { login, type LoginActionState } from './_actions';

const initialState: LoginActionState = { ok: true };

export function LoginForm({ verified }: { verified: boolean }) {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <form action={action} className="flex flex-col gap-5">
      {verified ? (
        <p className="rounded border border-accent/30 bg-accent/10 p-3 text-body text-primary">
          Email verified. You can log in now.
        </p>
      ) : null}

      {state.formError ? (
        <p className="rounded border border-danger/30 bg-danger/10 p-3 text-body text-danger">
          {state.formError}
          {state.unverifiedEmail ? (
            <>
              {' '}
              <Link
                href={`/verify?email=${encodeURIComponent(state.unverifiedEmail)}`}
                className="underline-offset-4 hover:underline"
              >
                Go to verification
              </Link>
              .
            </>
          ) : null}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-caption uppercase text-tertiary"
        >
          Email
        </label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <label htmlFor="password" className="text-caption uppercase text-tertiary">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-caption text-tertiary underline-offset-4 hover:text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? 'Logging in…' : 'Log in'}
      </Button>

      <p className="text-center text-body text-secondary">
        New here?{' '}
        <Link href="/register" className="text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
