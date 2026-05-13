import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { VerifyForm } from './_form';

export const metadata = {
  title: 'Verify your email — Advertising Platform',
};

const querySchema = z.object({ email: z.string().email() });

interface PageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function VerifyPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    redirect('/register');
  }
  const { email } = parsed.data;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">Step 3 of 3</p>
        <h1 className="text-display-lg tracking-tight text-primary">
          Check your inbox
        </h1>
        <p className="text-body-lg text-secondary">
          We sent a 6-digit code to{' '}
          <span className="text-primary">{email}</span>. Enter it below to
          confirm your email.
        </p>
      </header>

      <VerifyForm email={email} />

      <p className="text-body text-secondary">
        Wrong email?{' '}
        <Link
          href="/register"
          className="text-primary underline-offset-4 hover:underline"
        >
          Start over
        </Link>
      </p>
    </div>
  );
}
