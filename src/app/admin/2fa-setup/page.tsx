import * as React from 'react';
import Image from 'next/image';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { generateEnrollment } from '@/lib/totp';
import { adminMfaDisabled } from '@/lib/admin-guard';

import { EnrollForm } from './_form';

export const metadata = {
  title: 'Set up 2FA — Advertising Platform',
};

export default async function AdminMfaSetupPage() {
  if (adminMfaDisabled) redirect('/admin');

  const session = await auth();
  if (!session?.user) redirect('/admin/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, role: true, twoFactorEnabled: true },
  });
  if (!user || user.role !== 'ADMIN') redirect('/admin/login');
  if (user.twoFactorEnabled) redirect('/admin/2fa');

  // Fresh secret generated on every render of this page. The secret is held
  // in the form as a hidden field and only persists to the DB (encrypted)
  // after the user enters a matching TOTP code. Reloading restarts enrollment.
  const enrollment = await generateEnrollment(user.email);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <header className="mb-8 flex flex-col gap-2">
          <p className="text-caption uppercase text-tertiary">Super Admin · Step 1 of 2</p>
          <h1 className="text-display-lg tracking-tight text-primary">
            Set up two-factor auth
          </h1>
          <p className="text-body-lg text-secondary">
            Scan the QR with Google Authenticator, 1Password, Authy, or any
            TOTP app, then enter the 6-digit code below.
          </p>
        </header>

        <div className="mb-6 flex flex-col items-center gap-3 rounded-lg border border-border-subtle bg-surface p-5">
          <Image
            src={enrollment.qrDataUrl}
            width={240}
            height={240}
            alt="2FA enrollment QR code"
            className="rounded-md"
            unoptimized
          />
          <details className="text-caption text-tertiary">
            <summary className="cursor-pointer underline-offset-4 hover:underline">
              Can&apos;t scan? Show the secret
            </summary>
            <code className="mt-2 block break-all rounded bg-background p-2 font-mono text-code text-primary">
              {enrollment.secret}
            </code>
          </details>
        </div>

        <EnrollForm secret={enrollment.secret} />
      </div>
    </main>
  );
}
