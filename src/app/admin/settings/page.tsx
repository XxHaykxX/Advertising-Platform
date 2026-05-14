import * as React from 'react';
import Link from 'next/link';

import { requireAdmin } from '@/lib/admin-guard';
import { getContent } from '@/lib/platform-content';
import { getInquirySlaHours } from '@/lib/platform-settings';

import { ContentForm, SlaForm } from './_forms';

export const metadata = {
  title: 'Settings — Admin',
};

export default async function AdminSettingsPage() {
  await requireAdmin();

  const [slaHours, terms, privacy, faq] = await Promise.all([
    getInquirySlaHours(),
    getContent('terms'),
    getContent('privacy'),
    getContent('faq'),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-8 py-12">
      <header className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-caption uppercase text-tertiary">Super Admin · Platform</p>
          <h1 className="text-display-md tracking-tight text-primary">Settings</h1>
          <p className="text-body text-secondary">
            Platform-wide knobs you can change without redeploying. SLA hours
            apply to new inquiries; legal-page edits propagate immediately to
            the public site.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          ← Admin home
        </Link>
      </header>

      <SlaForm currentHours={slaHours} />

      <section className="flex flex-col gap-3">
        <h2 className="text-h3 text-primary">Legal pages</h2>
        <p className="text-body text-secondary">
          Plain text. Blank line = paragraph break. Public visitors see whatever
          you save here on the matching `/terms`, `/privacy`, `/faq` URLs;
          static placeholders show until first save.
        </p>
        <ContentForm
          defaults={{
            slug: 'terms',
            title: terms.title,
            body: terms.body,
          }}
        />
        <ContentForm
          defaults={{
            slug: 'privacy',
            title: privacy.title,
            body: privacy.body,
          }}
        />
        <ContentForm
          defaults={{
            slug: 'faq',
            title: faq.title,
            body: faq.body,
          }}
        />
      </section>

      <p className="text-caption text-tertiary">
        Email templates editor + brand assets land in S-10.7b (templates are
        currently React Email components in /emails — code-edit territory).
      </p>
    </main>
  );
}
