import * as React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';

import { DecisionForm } from './_form';

export const metadata = {
  title: 'Review verification — Admin',
};

const formatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

interface SavedDocument {
  path: string;
  mimeType: string;
  originalName: string;
  size: number;
}

function isDocument(value: unknown): value is SavedDocument {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.path === 'string' &&
    typeof v.mimeType === 'string' &&
    typeof v.originalName === 'string' &&
    typeof v.size === 'number'
  );
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export default async function AdminVerificationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();

  const req = await prisma.verificationRequest.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      submittedAt: true,
      documents: true,
      decision: true,
      decisionReason: true,
      reviewedAt: true,
      company: {
        select: {
          id: true,
          name: true,
          legalName: true,
          taxId: true,
          type: true,
          foundingYear: true,
          country: true,
          address: true,
          logoUrl: true,
          channelsOfInterest: true,
          verificationStatus: true,
          industries: { select: { industry: { select: { name: true } } } },
          users: { select: { name: true, email: true, role: true } },
        },
      },
    },
  });

  if (!req) notFound();

  const docs: SavedDocument[] = Array.isArray(req.documents)
    ? (req.documents as unknown[]).filter(isDocument)
    : [];
  const channelInterests = Array.isArray(req.company.channelsOfInterest)
    ? (req.company.channelsOfInterest as string[])
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-8 py-12">
      <header className="flex flex-col gap-3">
        <Link
          href="/admin/verifications"
          className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          ← All pending
        </Link>
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-caption uppercase text-tertiary">
              Verification request · {req.id.slice(-8)}
            </p>
            <h1 className="text-display-md tracking-tight text-primary">
              {req.company.name}
            </h1>
            <p className="text-body text-secondary">
              Submitted {formatter.format(req.submittedAt)} · current status{' '}
              <span className="text-primary">{req.company.verificationStatus}</span>
            </p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface p-5">
          <h2 className="text-h3 text-primary">Company</h2>
          <DetailRow label="Display name" value={req.company.name} />
          <DetailRow label="Legal name" value={req.company.legalName} />
          <DetailRow label="Tax ID" value={req.company.taxId} />
          <DetailRow label="Type" value={req.company.type} />
          <DetailRow
            label="Founded"
            value={req.company.foundingYear ? String(req.company.foundingYear) : null}
          />
          <DetailRow label="Country" value={req.company.country} />
          <DetailRow label="Address" value={req.company.address} />
          <DetailRow
            label="Industries"
            value={
              req.company.industries.length
                ? req.company.industries.map((i) => i.industry.name).join(', ')
                : null
            }
          />
          {channelInterests && channelInterests.length ? (
            <DetailRow label="Channels of interest" value={channelInterests.join(', ')} />
          ) : null}
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface p-5">
          <h2 className="text-h3 text-primary">Contact</h2>
          {req.company.users.length === 0 ? (
            <p className="text-body text-secondary">No users — orphaned company.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-body text-primary">
              {req.company.users.map((u) => (
                <li
                  key={u.email}
                  className="flex flex-col rounded border border-border-subtle bg-background px-3 py-2"
                >
                  <span>{u.name}</span>
                  <span className="text-caption text-tertiary">
                    {u.email} · {u.role}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-h3 text-primary">Documents ({docs.length})</h2>
        {docs.length === 0 ? (
          <p className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-body text-warning">
            No documents attached. Use Request More Info if you need them.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {docs.map((doc) => {
              const fileUrl = `/admin/files/${doc.path}`;
              const isImage = doc.mimeType.startsWith('image/');
              const isPdf = doc.mimeType === 'application/pdf';
              return (
                <li
                  key={doc.path}
                  className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-4"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-body text-primary">{doc.originalName}</span>
                      <span className="text-caption text-tertiary">
                        {doc.mimeType} · {formatBytes(doc.size)}
                      </span>
                    </div>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-body text-accent underline-offset-4 hover:underline"
                    >
                      Open in new tab ↗
                    </a>
                  </div>
                  {isImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={fileUrl}
                      alt={doc.originalName}
                      className="max-h-[420px] w-auto rounded border border-border-subtle bg-background object-contain"
                    />
                  ) : isPdf ? (
                    <iframe
                      src={fileUrl}
                      title={doc.originalName}
                      className="h-[600px] w-full rounded border border-border-subtle bg-background"
                    />
                  ) : (
                    <p className="text-caption text-tertiary">
                      Preview not available — open in a new tab to view.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface p-5">
        <header className="flex flex-col gap-1">
          <h2 className="text-h3 text-primary">Decision</h2>
          <p className="text-caption text-tertiary">
            Approve unlocks listings/inquiries for the company. Reject is final until the
            user resubmits. Request More Info is a soft pause — user can edit and resubmit.
          </p>
        </header>
        <DecisionForm verificationRequestId={req.id} />
      </section>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption uppercase text-tertiary">{label}</span>
      <span className="text-body text-primary">{value || '—'}</span>
    </div>
  );
}
