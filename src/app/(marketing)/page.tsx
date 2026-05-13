import * as React from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-20">
      <section className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-display-xl tracking-tight text-primary">
          Find your next ad slot<span className="text-accent">.</span>
          <br />
          We handle the rest.
        </h1>
        <p className="max-w-xl text-body-lg text-secondary">
          Armenia&apos;s brokered marketplace for TV, radio, outdoor, video, and
          product placement. Browse the catalog, submit an inquiry, and our team
          takes it from there.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/register">Get started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">I have an account</Link>
          </Button>
        </div>
        <p className="text-caption uppercase text-tertiary">
          MVP scaffold · Phase 1
        </p>
      </section>
    </main>
  );
}
