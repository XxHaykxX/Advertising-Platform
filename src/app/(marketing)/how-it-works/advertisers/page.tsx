import * as React from 'react';
import Link from 'next/link';
import { Search, MessageSquare, Handshake } from 'lucide-react';

import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'How it works — Advertisers — Advertising Platform',
};

const steps = [
  {
    icon: <Search size={22} />,
    title: 'Browse the catalog',
    body: 'Filter by channel (TV, radio, outdoor, video, product placement), location, and the dates you need. Listings show availability, not prices — pricing comes through the inquiry.',
  },
  {
    icon: <MessageSquare size={22} />,
    title: 'Send a single inquiry',
    body: 'Click Request information on any listing. Fill in your budget, target dates, and creative notes. The inquiry lands with our team, not the publisher.',
  },
  {
    icon: <Handshake size={22} />,
    title: 'Track the status and close',
    body: 'Watch the inquiry move through New → Assigned → In Progress → Awaiting Publisher → Awaiting Advertiser → Confirmed. You chat with our team — we deal with the publisher in parallel.',
  },
];

export default function HowItWorksAdvertisersPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-12 px-6 py-20">
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">For advertisers</p>
        <h1 className="text-display-lg tracking-tight text-primary">
          One inquiry. One status. Zero publisher inboxes<span className="text-accent">.</span>
        </h1>
        <p className="text-body-lg text-secondary">
          You tell us what you want to run. We figure out who has slots, what
          they cost today, and whether the dates work. You see the answer in
          one cabinet.
        </p>
      </header>

      <ol className="flex flex-col gap-6">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="flex items-start gap-5 rounded-lg border border-border-subtle bg-surface p-6"
          >
            <span className="text-tertiary">
              <span className="block font-mono text-caption">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="mt-2 block">{s.icon}</span>
            </span>
            <span className="flex flex-col gap-2">
              <h3 className="text-h3 text-primary">{s.title}</h3>
              <p className="text-body-lg text-secondary">{s.body}</p>
            </span>
          </li>
        ))}
      </ol>

      <section className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-6">
        <h2 className="text-h3 text-primary">What it costs</h2>
        <p className="text-body-lg text-secondary">
          Registration is free during the MVP phase. The commission model is
          being finalised with pilot partners — see the{' '}
          <Link href="/faq" className="text-primary underline-offset-4 hover:underline">
            FAQ
          </Link>{' '}
          for the current state.
        </p>
      </section>

      <div>
        <Button asChild size="lg">
          <Link href="/register">Create an advertiser account</Link>
        </Button>
      </div>
    </main>
  );
}
