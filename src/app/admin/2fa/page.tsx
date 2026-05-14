import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { adminMfaDisabled } from '@/lib/admin-guard';

import { VerifyMfaForm } from './_form';

export const metadata = {
  title: 'Two-factor auth — Advertising Platform',
};

export default async function AdminMfaPage() {
  if (adminMfaDisabled) redirect('/admin');

  const session = await auth();
  if (!session?.user) redirect('/admin/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, twoFactorEnabled: true },
  });
  if (!user || user.role !== 'ADMIN') redirect('/admin/login');
  if (!user.twoFactorEnabled) redirect('/admin/2fa-setup');

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <header className="mb-8 flex flex-col gap-2">
          <p className="text-caption uppercase text-tertiary">Super Admin · Step 2 of 2</p>
          <h1 className="text-display-lg tracking-tight text-primary">
            Enter your 2FA code
          </h1>
          <p className="text-body-lg text-secondary">
            From your authenticator app.
          </p>
        </header>

        <VerifyMfaForm />

        <p className="mt-8 text-caption text-tertiary">
          Lost access to your authenticator?{' '}
          <Link
            href="/contact"
            className="underline-offset-4 hover:text-primary hover:underline"
          >
            Reach the team
          </Link>{' '}
          — admins recover only via in-person review.
        </p>
      </div>
    </main>
  );
}
