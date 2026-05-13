import * as React from 'react';
import { Mail, MapPin } from 'lucide-react';

export const metadata = {
  title: 'Contact — Advertising Platform',
};

export default function ContactPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">Contact</p>
        <h1 className="text-display-lg tracking-tight text-primary">
          Get in touch
        </h1>
        <p className="text-body-lg text-secondary">
          Question about a listing, an inquiry, or partnerships? We read every
          message.
        </p>
      </header>

      <section className="flex flex-col gap-5">
        <a
          href="mailto:hello@advertising-platform.am"
          className="flex items-start gap-4 rounded-lg border border-border-subtle bg-surface p-5 transition-colors duration-200 ease-out-expo hover:border-border-strong hover:bg-surface-elevated"
        >
          <span className="mt-1 text-accent">
            <Mail size={22} />
          </span>
          <span className="flex flex-col">
            <span className="text-h3 text-primary">Email us</span>
            <span className="text-body text-secondary">
              hello@advertising-platform.am
            </span>
            <span className="mt-1 text-caption text-tertiary">
              We typically reply within 1 business day.
            </span>
          </span>
        </a>

        <div className="flex items-start gap-4 rounded-lg border border-border-subtle bg-surface p-5">
          <span className="mt-1 text-tertiary">
            <MapPin size={22} />
          </span>
          <span className="flex flex-col">
            <span className="text-h3 text-primary">Where we are</span>
            <span className="text-body text-secondary">Yerevan, Armenia</span>
            <span className="mt-1 text-caption text-tertiary">
              The platform is operated remotely — visits by appointment only.
            </span>
          </span>
        </div>
      </section>
    </main>
  );
}
