import * as React from 'react';

export const metadata = {
  title: 'Terms of Service — Advertising Platform',
};

export default function TermsPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">Legal</p>
        <h1 className="text-display-lg tracking-tight text-primary">
          Terms of Service
        </h1>
        <p className="text-body text-tertiary">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
        </p>
      </header>

      <section className="flex flex-col gap-4 text-body-lg text-secondary">
        <p>
          <strong className="text-primary">Placeholder.</strong> This document is
          a working draft. Final terms will be reviewed by counsel before public
          launch. By using the platform during the closed pilot you agree to act
          in good faith and use it for legitimate commercial purposes only.
        </p>

        <h2 className="mt-4 text-h2 text-primary">1. The service</h2>
        <p>
          The Advertising Platform is a brokered marketplace connecting
          advertisers and publishers of advertising inventory. The platform team
          mediates all conversations between the parties; advertisers and
          publishers do not contact each other directly.
        </p>

        <h2 className="mt-4 text-h2 text-primary">2. Accounts</h2>
        <p>
          You must register an account to submit inquiries or publish listings.
          You are responsible for keeping your password confidential and for the
          activity that occurs under your account.
        </p>

        <h2 className="mt-4 text-h2 text-primary">3. Acceptable use</h2>
        <p>
          You may not use the platform for illegal content, harassment, fraud,
          or activity that breaches Armenian advertising regulations. We
          reserve the right to suspend accounts that violate these rules.
        </p>

        <h2 className="mt-4 text-h2 text-primary">4. Termination</h2>
        <p>
          You may close your account at any time. We may suspend or terminate
          accounts for breach of these terms, with reasonable notice except
          where immediate action is required.
        </p>

        <h2 className="mt-4 text-h2 text-primary">5. Liability</h2>
        <p>
          The platform is provided as-is during the MVP phase. We are not party
          to the underlying advertising contracts between advertisers and
          publishers and accept no liability for those agreements.
        </p>
      </section>
    </main>
  );
}
