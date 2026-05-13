import * as React from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingHeader } from '@/components/marketing/header';

export const metadata = {
  title: 'Not found — Advertising Platform',
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-caption uppercase text-tertiary">404</p>
        <h1 className="text-display-xl tracking-tight text-primary">
          That page doesn&apos;t exist<span className="text-accent">.</span>
        </h1>
        <p className="max-w-md text-body-lg text-secondary">
          Browse the catalog instead, or head back to the homepage.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/">Back home</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
