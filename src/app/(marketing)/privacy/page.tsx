import * as React from 'react';

export const metadata = {
  title: 'Privacy Policy — Advertising Platform',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">Legal</p>
        <h1 className="text-display-lg tracking-tight text-primary">
          Privacy Policy
        </h1>
        <p className="text-body text-tertiary">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
        </p>
      </header>

      <section className="flex flex-col gap-4 text-body-lg text-secondary">
        <p>
          <strong className="text-primary">Placeholder.</strong> Final privacy
          policy will be reviewed by counsel before public launch. Below is the
          intended baseline.
        </p>

        <h2 className="mt-4 text-h2 text-primary">What we collect</h2>
        <p>
          Account data (name, email, phone), company data (legal name, tax ID,
          address), inquiry and listing content you create, and standard
          web-server logs.
        </p>

        <h2 className="mt-4 text-h2 text-primary">How we use it</h2>
        <p>
          To operate the brokered marketplace: route your inquiries to our team,
          contact you about platform updates, and verify your company. We don&apos;t
          sell personal data.
        </p>

        <h2 className="mt-4 text-h2 text-primary">Sub-processors</h2>
        <p>
          We use Resend for transactional email, Sentry for error monitoring,
          PostHog (EU region) for analytics, and Hostinger for hosting and
          database storage. Chat is handled by a third-party provider (to be
          finalised before Phase 3).
        </p>

        <h2 className="mt-4 text-h2 text-primary">Your rights</h2>
        <p>
          You can request your data, correct it, or close your account at any
          time. Email <a href="mailto:privacy@advertising-platform.am" className="text-primary underline-offset-4 hover:underline">privacy@advertising-platform.am</a>.
        </p>

        <h2 className="mt-4 text-h2 text-primary">Retention</h2>
        <p>
          Account data is retained while your account is active. Inquiry
          history is retained for 5 years for tax and audit purposes after
          which it is anonymised.
        </p>
      </section>
    </main>
  );
}
