import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

import { CreateListingForm } from './_form';

export const metadata = {
  title: 'New listing — Advertising Platform',
};

export default async function NewListingPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      company: { select: { canPublish: true } },
    },
  });
  if (!user) redirect('/login');
  if (user.role !== 'PUBLISHER') redirect('/dashboard');
  if (!user.company?.canPublish) redirect('/dashboard');

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <Link
        href="/listings/mine"
        className="inline-flex w-fit items-center gap-1 text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
      >
        <ArrowLeft size={14} /> My listings
      </Link>

      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">New listing</p>
        <h1 className="text-display-lg tracking-tight text-primary">
          Describe what you have to sell
        </h1>
        <p className="text-body-lg text-secondary">
          No prices on listings — pricing comes through the inquiry. Tell
          advertisers what the slot is, when it runs, and who watches.
        </p>
      </header>

      <CreateListingForm />
    </main>
  );
}
