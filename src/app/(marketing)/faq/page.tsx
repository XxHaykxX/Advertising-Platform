import * as React from 'react';

import { getContent } from '@/lib/platform-content';

export const metadata = {
  title: 'FAQ — Advertising Platform',
};

interface QA {
  q: string;
  a: React.ReactNode;
}

// Curated Q&A list. Used when the admin hasn't overridden /faq from the
// platform-content CMS — the curated tone is hard to keep in plain text, so
// the static list is the better default until someone deliberately replaces
// it.
const CURATED: QA[] = [
  {
    q: 'Who can register?',
    a: 'Companies that buy advertising (advertisers) and companies that sell ad inventory (publishers) — TV, radio, outdoor, video, product placement. Individual users register on behalf of a company.',
  },
  {
    q: 'Can my company be both an advertiser and a publisher?',
    a: 'You pick a primary role at signup. We can extend your account to the second role later — message support after your first verification is approved.',
  },
  {
    q: 'How much does it cost?',
    a: 'During the MVP phase, registration and inquiry submission are free. We are working out the commission model with pilot partners.',
  },
  {
    q: 'Why do I have to verify my email?',
    a: 'It confirms you control the inbox you registered with. Without verification you cannot log in. The 6-digit code expires in 10 minutes — you can request a new one every 60 seconds.',
  },
  {
    q: 'What is company verification?',
    a: 'After you create your account, you submit company documents (registration certificate, tax ID). Our team reviews and approves within 2 business days. Until then you can browse the catalog but cannot submit inquiries or publish listings.',
  },
  {
    q: 'My documents were rejected — what now?',
    a: 'You will receive an email with the specific reason. You can resubmit corrected documents from your cabinet at any time.',
  },
  {
    q: 'How do I contact a publisher about a slot?',
    a: 'You submit an Inquiry from the listing page. Our team picks it up, gathers details from both sides, and brokers the conversation. Advertisers and publishers do not see each other directly until the deal is confirmed.',
  },
  {
    q: 'How long until I hear back?',
    a: 'Our team aims to respond to new inquiries within 1 business day. Each inquiry has a visible status (New, Assigned, In Progress, Awaiting Publisher, Awaiting Advertiser, Confirmed, Closed) so you always know where it stands.',
  },
  {
    q: 'Where do messages live?',
    a: 'In the inquiry chat panel in your cabinet. You get a separate chat with our team — advertisers do not chat with publishers directly.',
  },
];

export default async function FaqPage() {
  const content = await getContent('faq');

  if (content.fromDb) {
    const paragraphs = content.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-2">
          <p className="text-caption uppercase text-tertiary">Help</p>
          <h1 className="text-display-lg tracking-tight text-primary">{content.title}</h1>
        </header>
        <section className="flex flex-col gap-4 text-body-lg text-secondary">
          {paragraphs.map((p, idx) => (
            <p key={idx} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">Help</p>
        <h1 className="text-display-lg tracking-tight text-primary">
          Frequently asked questions
        </h1>
        <p className="text-body-lg text-secondary">
          Quick answers to the questions we hear most. Missing something? Drop
          us a line — see{' '}
          <a href="/contact" className="text-primary underline-offset-4 hover:underline">
            Contact
          </a>
          .
        </p>
      </header>

      <ul className="flex flex-col gap-6">
        {CURATED.map(({ q, a }) => (
          <li
            key={q}
            className="flex flex-col gap-2 border-b border-border-subtle pb-6 last:border-b-0"
          >
            <h2 className="text-h3 text-primary">{q}</h2>
            <p className="text-body-lg text-secondary">{a}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
