import * as React from 'react';

// S-01.6 — Phase 1 placeholder. Dashed-border tiles instead of fake logos:
// brand voice principle §2 says "Confidence over reassurance" — false trust
// signals violate it. Phase 4 wiring (real Company.logoUrl values) lands in
// E-10 alongside the Featured Publishers curator.

const SLOTS = 6;

export function OurPartners() {
  return (
    <section className="border-t border-border-subtle">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-16">
        <header className="flex flex-col gap-2">
          <p className="text-caption uppercase text-tertiary">Our partners</p>
          <h2 className="text-display-lg tracking-tight text-primary">
            Brokering for Armenia&apos;s media
          </h2>
          <p className="text-body-lg text-secondary">
            Onboarding the first set of publishers right now. Partner reveal at
            launch — we won&apos;t fill this space with logos we don&apos;t
            yet have.
          </p>
        </header>

        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: SLOTS }).map((_, i) => (
            <li
              key={i}
              aria-hidden
              className="flex aspect-[3/2] items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface/50"
            >
              <span className="text-caption uppercase tracking-wider text-tertiary">
                {String(i + 1).padStart(2, '0')}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
