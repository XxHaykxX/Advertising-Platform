'use client';

import * as React from 'react';

import {
  allowedInquiryTransitions,
  inquiryStatusLabels,
  type InquiryStatusInput,
} from '@/lib/validation/inquiry';

import { changeInquiryStatus, reassignInquiry } from './_actions';

interface ReassignProps {
  inquiryId: string;
  currentAdminId: string | null;
  admins: Array<{ id: string; name: string }>;
}

export function ReassignControl({ inquiryId, currentAdminId, admins }: ReassignProps) {
  // Native form action handles the server call + revalidation. Submitting on
  // change keeps the row controls keystroke-cheap (no second click).
  return (
    <form action={reassignInquiry} className="flex items-center gap-2">
      <input type="hidden" name="inquiryId" value={inquiryId} />
      <select
        name="assignedAdminId"
        defaultValue={currentAdminId ?? 'unassigned'}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="rounded border border-border-subtle bg-background px-2 py-1 text-caption text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
      >
        <option value="unassigned">Unassigned</option>
        {admins.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
    </form>
  );
}

interface StatusProps {
  inquiryId: string;
  currentStatus: InquiryStatusInput;
}

export function StatusControl({ inquiryId, currentStatus }: StatusProps) {
  const allowed = allowedInquiryTransitions[currentStatus];

  if (allowed.length === 0) {
    return <span className="text-caption text-tertiary">Terminal</span>;
  }

  return (
    <form action={changeInquiryStatus} className="flex items-center gap-2">
      <input type="hidden" name="inquiryId" value={inquiryId} />
      <select
        name="status"
        defaultValue=""
        onChange={(event) => {
          if (event.currentTarget.value) {
            event.currentTarget.form?.requestSubmit();
          }
        }}
        className="rounded border border-border-subtle bg-background px-2 py-1 text-caption text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
      >
        <option value="" disabled>
          Change →
        </option>
        {allowed.map((s) => (
          <option key={s} value={s}>
            {inquiryStatusLabels[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
