import * as React from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'About — Advertising Platform',
};

export default function AboutPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-20">
      <header className="flex flex-col gap-3">
        <p className="text-caption uppercase text-tertiary">About</p>
        <h1 className="text-display-lg tracking-tight text-primary">
          A small team turning ad-buying in Armenia into a marketplace<span className="text-accent">.</span>
        </h1>
      </header>

      <section className="flex flex-col gap-4 text-body-lg text-secondary">
        <p>
          Ad inventory in Armenia is a phone-and-email game. Buyers hunt for
          the right contact at each broadcaster, billboard operator, or
          studio. Sellers field repeat questions about availability, rates,
          and slots that may or may not still exist.
        </p>

        <p>
          We sit in the middle. Publishers list what they have. Advertisers
          submit inquiries. Our team handles the back-and-forth — pricing,
          dates, creative requirements, contract signing. Both sides get a
          clean cabinet with the status of every deal and a single point of
          contact on our team.
        </p>

        <p>
          We do not sell ads ourselves and we do not represent either side
          exclusively. Our incentive is to close fair deals quickly.
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-6">
        <h2 className="text-h3 text-primary">Where we are</h2>
        <p className="text-body text-secondary">
          Yerevan, Armenia. Operated remotely. Reach us at{' '}
          <a
            href="mailto:hello@advertising-platform.am"
            className="text-primary underline-offset-4 hover:underline"
          >
            hello@advertising-platform.am
          </a>
          .
        </p>
      </section>

      <div>
        <Button asChild size="lg">
          <Link href="/register">Get started</Link>
        </Button>
      </div>
    </main>
  );
}
