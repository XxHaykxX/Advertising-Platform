import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { RoleEnum } from '@/lib/validation/register';

import { PersonalForm } from './_form';

export const metadata = {
  title: 'Your details — Advertising Platform',
};

interface PageProps {
  searchParams: Promise<{ role?: string }>;
}

export default async function RegisterPersonalPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const parsed = RoleEnum.safeParse(params.role);
  if (!parsed.success) {
    redirect('/register');
  }
  const role = parsed.data;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">Step 2 of 2</p>
        <h1 className="text-display-lg tracking-tight text-primary">Your details</h1>
        <p className="text-body-lg text-secondary">
          You&apos;re joining as an{' '}
          <span className="text-primary">{role === 'advertiser' ? 'Advertiser' : 'Publisher'}</span>
          .{' '}
          <Link
            href="/register"
            className="inline-flex items-center gap-1 text-secondary underline-offset-4 hover:text-primary hover:underline"
          >
            <ArrowLeft size={14} /> Change role
          </Link>
        </p>
      </header>

      <PersonalForm role={role} />
    </div>
  );
}
