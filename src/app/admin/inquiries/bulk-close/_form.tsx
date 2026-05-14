'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';

import { SubmitButton } from '@/components/ui/submit-button';

import { bulkCloseInquiries, type BulkCloseState } from '../_bulk-actions';

const initialState: BulkCloseState = { ok: true };

interface Props {
  ids: string[];
  target: 'CONFIRMED' | 'LOST' | 'CANCELLED';
}

const PLACEHOLDER: Record<Props['target'], string> = {
  CONFIRMED:
    'Optional shared note — e.g. "Q3 quarterly buy confirmed across these three accounts."',
  LOST:
    'Required shared reason — e.g. "End-of-quarter budget freeze, retry in Sept."',
  CANCELLED:
    'Required shared reason — e.g. "Pilot cancelled while we firm up pricing."',
};

export function BulkCloseForm({ ids, target }: Props) {
  const [state, action] = useFormState(bulkCloseInquiries, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      {ids.map((id) => (
        <input key={id} type="hidden" name="inquiryIds" value={id} />
      ))}
      <input type="hidden" name="target" value={target} />

      <label className="flex flex-col gap-1.5">
        <span className="text-caption uppercase text-tertiary">
          {target === 'CONFIRMED'
            ? 'Optional shared note'
            : 'Shared reason (required ≥5 chars)'}
        </span>
        <textarea
          name="reason"
          rows={4}
          placeholder={PLACEHOLDER[target]}
          className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary placeholder:text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
      </label>

      {state.formError ? (
        <p
          role="alert"
          className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-body text-danger"
        >
          {state.formError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton
          variant={target === 'CONFIRMED' ? 'default' : 'destructive'}
          pendingLabel="Closing…"
        >
          {target === 'CONFIRMED'
            ? `Confirm ${ids.length}`
            : target === 'LOST'
              ? `Mark ${ids.length} as Lost`
              : `Cancel ${ids.length}`}
        </SubmitButton>
        <p className="text-caption text-tertiary">
          Same reason is written to every selected inquiry.
        </p>
      </div>
    </form>
  );
}
