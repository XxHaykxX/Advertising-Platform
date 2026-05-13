import * as React from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="px-8 py-6">
        <Link
          href="/"
          className="text-body-lg font-medium tracking-tight text-primary"
        >
          ADVERTISING<span className="text-accent">.</span>
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </main>
  );
}
