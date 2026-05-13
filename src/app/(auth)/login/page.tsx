import * as React from 'react';

import { LoginForm } from './_form';

export const metadata = {
  title: 'Log in — Advertising Platform',
};

interface PageProps {
  searchParams: Promise<{ verified?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const verified = params.verified === '1';

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-display-lg tracking-tight text-primary">
          Welcome back
        </h1>
        <p className="text-body-lg text-secondary">
          Log in to manage your inquiries, listings, or admin queue.
        </p>
      </header>

      <LoginForm verified={verified} />
    </div>
  );
}
