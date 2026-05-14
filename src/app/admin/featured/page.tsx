import * as React from 'react';
import Link from 'next/link';

import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';

import { removeFeatured, updatePosition } from './_actions';
import { AddFeaturedForm } from './_form';

export const metadata = {
  title: 'Featured listings — Admin',
};

const dateFmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

export default async function AdminFeaturedPage() {
  await requireAdmin();

  const [featured, activeListings] = await prisma.$transaction([
    prisma.featuredListing.findMany({
      orderBy: { position: 'asc' },
      select: {
        id: true,
        position: true,
        startsAt: true,
        endsAt: true,
        listing: {
          select: {
            id: true,
            title: true,
            status: true,
            channelType: true,
            company: { select: { name: true } },
          },
        },
      },
    }),
    prisma.listing.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        title: true,
        company: { select: { name: true } },
      },
    }),
  ]);

  const now = new Date();
  const featuredIds = new Set(featured.map((f) => f.listing.id));
  const availableListings = activeListings.filter((l) => !featuredIds.has(l.id));

  function status(f: { startsAt: Date | null; endsAt: Date | null }): string {
    if (!f.startsAt && !f.endsAt) return 'Always';
    if (f.endsAt && f.endsAt <= now) return 'Ended';
    if (f.startsAt && f.startsAt > now) return 'Scheduled';
    return 'Live';
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-8 py-12">
      <header className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-caption uppercase text-tertiary">Super Admin · Curation</p>
          <h1 className="text-display-md tracking-tight text-primary">Featured listings</h1>
          <p className="text-body text-secondary">
            Lower position = higher in the homepage spotlight. Optional start/end
            window controls visibility.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          ← Admin home
        </Link>
      </header>

      <AddFeaturedForm
        listings={availableListings.map((l) => ({
          id: l.id,
          label: `${l.title} — ${l.company.name}`,
        }))}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-h3 text-primary">Current ({featured.length})</h2>
        {featured.length === 0 ? (
          <p className="rounded-lg border border-border-subtle bg-surface p-5 text-body text-secondary">
            Nothing featured yet. Homepage will fall back to mock samples.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {featured.map((f) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center gap-4 rounded-lg border border-border-subtle bg-surface p-4"
              >
                <span className="font-mono text-caption text-tertiary">
                  #{f.position}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="text-body text-primary">{f.listing.title}</p>
                  <p className="text-caption text-tertiary">
                    {f.listing.company.name} · {f.listing.channelType.replace(/_/g, ' ')}
                  </p>
                  <p className="text-caption text-tertiary">
                    {status(f)} ·{' '}
                    {f.startsAt ? dateFmt.format(f.startsAt) : 'no start'} →{' '}
                    {f.endsAt ? dateFmt.format(f.endsAt) : 'no end'}
                  </p>
                </div>
                <form
                  action={updatePosition}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="id" value={f.id} />
                  <input
                    type="number"
                    name="position"
                    defaultValue={f.position}
                    min={0}
                    max={999}
                    className="w-20 rounded border border-border-subtle bg-background px-2 py-1 text-caption text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                  />
                  <button
                    type="submit"
                    className="text-caption text-secondary underline-offset-4 hover:text-primary hover:underline"
                  >
                    Save
                  </button>
                </form>
                <form action={removeFeatured}>
                  <input type="hidden" name="id" value={f.id} />
                  <button
                    type="submit"
                    className="text-caption text-danger underline-offset-4 hover:underline"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-caption text-tertiary">
        Drag-and-drop reordering (S-10.5b) — position-by-number is the MVP
        replacement.
      </p>
    </main>
  );
}
