import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ResetForm } from './_form';

export const metadata = {
  title: 'Set a new password — Advertising Platform',
};

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.token?.trim();

  if (!token || token.length < 20) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-display-lg tracking-tight text-primary">
          Reset link is missing
        </h1>
        <p className="text-body-lg text-secondary">
          This page needs a valid token. If your link is broken, request a new
          one.
        </p>
        <Link
          href="/forgot-password"
          className="text-primary underline-offset-4 hover:underline"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-display-lg tracking-tight text-primary">
          Set a new password
        </h1>
        <p className="text-body-lg text-secondary">
          Pick a strong password — at least 8 characters.
        </p>
      </header>

      <ResetForm token={token} />
    </div>
  );
}
