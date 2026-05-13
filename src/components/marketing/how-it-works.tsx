import * as React from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

const steps = [
  {
    n: '01',
    title: 'Browse inventory',
    body: 'TV, radio, outdoor, video, product placement. Search by channel, location, and dates. No prices on listings — only what is available and when.',
  },
  {
    n: '02',
    title: 'Submit an inquiry',
    body: 'Tell us what you want, the budget you have, and when you want to run. The inquiry goes to our team, not the publisher directly.',
  },
  {
    n: '03',
    title: 'We broker the deal',
    body: 'Our team negotiates rates, dates, and creative requirements with the publisher. You see status updates in your cabinet. When both sides agree, we sign.',
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-border-subtle bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-20">
        <header className="flex flex-col gap-2">
          <p className="text-caption uppercase text-tertiary">How it works</p>
          <h2 className="text-display-lg tracking-tight text-primary">
            Three steps. No publisher inbox to wrangle.
          </h2>
        </header>

        <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="flex flex-col gap-3">
              <p className="font-mono text-caption text-tertiary">{s.n}</p>
              <h3 className="text-h3 text-primary">{s.title}</h3>
              <p className="text-body text-secondary">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline">
            <Link href="/how-it-works/advertisers">For advertisers</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/how-it-works/publishers">For publishers</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
