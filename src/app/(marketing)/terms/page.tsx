import * as React from 'react';

import { getContent } from '@/lib/platform-content';

export const metadata = {
  title: 'Terms of Service — Advertising Platform',
};

const dateFmt = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' });

export default async function TermsPage() {
  const content = await getContent('terms');
  const paragraphs = content.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">Legal</p>
        <h1 className="text-display-lg tracking-tight text-primary">{content.title}</h1>
        <p className="text-body text-tertiary">
          Last updated:{' '}
          {content.updatedAt ? dateFmt.format(content.updatedAt) : dateFmt.format(new Date())}
        </p>
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
