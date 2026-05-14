import * as React from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

// S-01.7 — Phase 1 placeholder. No mock case studies — same reason as
// our-partners.tsx. The Phase 4 implementation requires a curated
// CaseStudy table + admin curator + per-case consent flow.

export function OurWorks() {
  return (
    <section className="bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-16">
        <header className="flex flex-col gap-2">
          <p className="text-caption uppercase text-tertiary">Our works</p>
          <h2 className="text-display-lg tracking-tight text-primary">
            Case studies publish after the first deals close
          </h2>
          <p className="text-body-lg text-secondary">
            Every case here will be a real deal we brokered, with the
            advertiser and publisher named only with their consent. We
            won&apos;t fake them. Watch this space.
          </p>
        </header>

        <div className="rounded-lg border border-border-subtle bg-background p-6">
          <p className="text-body text-secondary">
            Want to be one of the first three case studies? Onboard during the
            pilot and we&apos;ll work the brief with you end-to-end.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/register">Join the pilot</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contact">Talk to us first</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
