import * as React from 'react';
import Link from 'next/link';

const legal: Array<{ href: string; label: string }> = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border-subtle">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <p className="text-body text-secondary">
          ADVERTISING<span className="text-accent">.</span> — Armenia&apos;s
          brokered marketplace for ad inventory.
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {legal.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <p className="border-t border-border-subtle py-4 text-center text-caption text-tertiary">
        © {new Date().getFullYear()} Advertising Platform · Yerevan, Armenia
      </p>
    </footer>
  );
}
