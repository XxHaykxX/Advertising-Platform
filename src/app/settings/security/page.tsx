import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { auth } from '@/auth';

import { ChangePasswordForm } from './_form';

export const metadata = {
  title: 'Security — Advertising Platform',
};

export default async function SecurityPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <main className="mx-auto flex max-w-md flex-col gap-8 px-6 py-16">
      <Link
        href="/dashboard"
        className="inline-flex w-fit items-center gap-1 text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
      >
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">Security</p>
        <h1 className="text-display-lg tracking-tight text-primary">
          Change password
        </h1>
        <p className="text-body-lg text-secondary">
          Rotate your password. You&apos;ll need the current one.
        </p>
      </header>

      <ChangePasswordForm />
    </main>
  );
}
