import * as React from 'react';
import Link from 'next/link';

import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';

import { CreateIndustryForm } from './_create-form';
import { IndustryRowControls } from './_row-controls';

export const metadata = {
  title: 'Industries — Admin taxonomy',
};

export default async function AdminTaxonomyIndustriesPage() {
  await requireAdmin();

  const industries = await prisma.industry.findMany({
    orderBy: [{ archived: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      parentId: true,
      archived: true,
      _count: { select: { companies: true } },
    },
  });

  const parents = industries
    .filter((i) => !i.archived && !i.parentId)
    .map((i) => ({ id: i.id, name: i.name }));

  // Group by parent for the hierarchy view. Top-level industries first;
  // children render indented underneath their parent.
  const childrenByParent = new Map<string, typeof industries>();
  for (const i of industries) {
    if (!i.parentId) continue;
    const arr = childrenByParent.get(i.parentId) ?? [];
    arr.push(i);
    childrenByParent.set(i.parentId, arr);
  }
  const topLevel = industries.filter((i) => !i.parentId);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-8 py-12">
      <header className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-caption uppercase text-tertiary">Super Admin · Taxonomy</p>
          <h1 className="text-display-md tracking-tight text-primary">Industries</h1>
          <p className="text-body text-secondary">
            {industries.filter((i) => !i.archived).length} active ·{' '}
            {industries.filter((i) => i.archived).length} archived
          </p>
        </div>
        <Link
          href="/admin"
          className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          ← Admin home
        </Link>
      </header>

      <CreateIndustryForm parents={parents} />

      <section className="rounded-lg border border-border-subtle bg-surface p-5">
        <h2 className="text-h3 text-primary">All industries</h2>
        <p className="mb-4 text-caption text-tertiary">
          Archived industries stay attached to existing companies; just hidden
          from new selections.
        </p>
        <ul className="flex flex-col divide-y divide-border-subtle">
          {topLevel.map((parent) => {
            const kids = childrenByParent.get(parent.id) ?? [];
            return (
              <li key={parent.id} className="flex flex-col gap-2 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <IndustryRowControls
                    id={parent.id}
                    name={parent.name}
                    archived={parent.archived}
                  />
                  <span className="text-caption text-tertiary">
                    {parent._count.companies} compan
                    {parent._count.companies === 1 ? 'y' : 'ies'}
                  </span>
                </div>
                {kids.length ? (
                  <ul className="ml-6 flex flex-col gap-2 border-l border-border-subtle pl-4">
                    {kids.map((kid) => (
                      <li
                        key={kid.id}
                        className="flex items-baseline justify-between gap-3"
                      >
                        <IndustryRowControls
                          id={kid.id}
                          name={kid.name}
                          archived={kid.archived}
                        />
                        <span className="text-caption text-tertiary">
                          {kid._count.companies}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-lg border border-border-subtle bg-surface p-5">
        <h2 className="text-h3 text-primary">Other taxonomies</h2>
        <ul className="flex flex-col gap-1 text-body text-secondary">
          <li>
            <strong className="text-primary">Channel types</strong> are a Prisma enum — changes
            require a schema migration, not a runtime edit. Deliberately out of scope here.
          </li>
          <li>
            <strong className="text-primary">Source channels</strong> are managed per publisher
            when they create / edit a listing.
          </li>
          <li>
            <strong className="text-primary">Regions</strong> live as free text on listings
            (audienceDemographics.region) — a Region model lands in S-10.1b if we need
            controlled values.
          </li>
        </ul>
      </section>
    </main>
  );
}
