'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import {
  allowedInquiryTransitions,
  inquiryStatusLabels,
  type InquiryStatusInput,
} from '@/lib/validation/inquiry';

import { changeInquiryStatus, reassignInquiry } from './_actions';

// Terminal transitions need a reason capture per S-09.7. Instead of a JS
// modal we route to /admin/inquiries/[id]/close?as=... and let that page own
// the form. Same dropdown, different escape hatch.
const TERMINAL: ReadonlySet<InquiryStatusInput> = new Set([
  'CONFIRMED',
  'LOST',
  'CANCELLED',
]);

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
  const router = useRouter();
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
          const value = event.currentTarget.value as InquiryStatusInput | '';
          if (!value) return;
          if (TERMINAL.has(value)) {
            // Reset the select so a re-click on the same option still fires.
            event.currentTarget.value = '';
            router.push(
              `/admin/inquiries/${inquiryId}/close?as=${value.toLowerCase()}`
            );
            return;
          }
          event.currentTarget.form?.requestSubmit();
        }}
        className="rounded border border-border-subtle bg-background px-2 py-1 text-caption text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
      >
        <option value="" disabled>
          Change →
        </option>
        {allowed.map((s) => (
          <option key={s} value={s}>
            {inquiryStatusLabels[s]}
            {TERMINAL.has(s) ? ' (with reason)' : ''}
          </option>
        ))}
      </select>
    </form>
  );
}
