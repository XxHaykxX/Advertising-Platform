'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';

import { SubmitButton } from '@/components/ui/submit-button';

import { closeInquiry, type CloseState } from './_actions';

const initialState: CloseState = { ok: true };

interface Props {
  inquiryId: string;
  target: 'CONFIRMED' | 'LOST' | 'CANCELLED';
}

const TARGET_COPY: Record<Props['target'], { label: string; placeholder: string }> = {
  CONFIRMED: {
    label: 'Optional note (deal terms, who confirmed, anything worth recording)',
    placeholder: 'Confirmed by phone at 14:30. 30 spots / 4 weeks at agreed rate.',
  },
  LOST: {
    label: 'Why was this lost? (required, visible only to admins)',
    placeholder: 'Advertiser went with a different channel mix — too pricey for the run length.',
  },
  CANCELLED: {
    label: 'Why was this cancelled? (required, visible only to admins)',
    placeholder: 'Advertiser asked us to pause the request indefinitely.',
  },
};

export function CloseForm({ inquiryId, target }: Props) {
  const [state, action] = useFormState(closeInquiry, initialState);
  const copy = TARGET_COPY[target];

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="inquiryId" value={inquiryId} />
      <input type="hidden" name="target" value={target} />

      <label className="flex flex-col gap-1.5">
        <span className="text-caption uppercase text-tertiary">{copy.label}</span>
        <textarea
          name="reason"
          rows={4}
          placeholder={copy.placeholder}
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
          pendingLabel="Saving…"
        >
          {target === 'CONFIRMED'
            ? 'Confirm and close'
            : target === 'LOST'
              ? 'Mark as Lost'
              : 'Cancel inquiry'}
        </SubmitButton>
      </div>
    </form>
  );
}
