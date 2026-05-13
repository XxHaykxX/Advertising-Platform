import * as React from 'react';
import Link from 'next/link';
import { ClipboardList, Inbox, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'How it works — Publishers — Advertising Platform',
};

const steps = [
  {
    icon: <ClipboardList size={22} />,
    title: 'Publish your inventory',
    body: 'Add the slots you have available — channel, format, dates, supplementary notes. You set availability; you do not need to publish prices.',
  },
  {
    icon: <Inbox size={22} />,
    title: 'We bring you qualified inquiries',
    body: 'When an advertiser is interested, our team contacts you with the brief, the budget range, and the timing they want. No cold inbound or back-and-forth filtering on your side.',
  },
  {
    icon: <CheckCircle2 size={22} />,
    title: 'You decide and close',
    body: 'Confirm the slot, propose adjustments, or decline. Our team carries that response back to the advertiser. Once both sides agree, we paper the deal.',
  },
];

export default function HowItWorksPublishersPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-12 px-6 py-20">
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">For publishers</p>
        <h1 className="text-display-lg tracking-tight text-primary">
          Your slots, in front of buyers ready to pay<span className="text-accent">.</span>
        </h1>
        <p className="text-body-lg text-secondary">
          List what is available. We send you qualified buyers, brief in hand.
          You spend zero time fielding tyre-kicker inquiries.
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
        <h2 className="text-h3 text-primary">Do I share my rate card?</h2>
        <p className="text-body-lg text-secondary">
          No. You quote each inquiry individually through our team. The
          platform never publishes your prices to the catalog.
        </p>
      </section>

      <div>
        <Button asChild size="lg">
          <Link href="/register">Create a publisher account</Link>
        </Button>
      </div>
    </main>
  );
}
