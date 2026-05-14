'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';

import { SubmitButton } from '@/components/ui/submit-button';

import { overrideListing, type OverrideState } from './_actions';

const initialState: OverrideState = { ok: true };

interface Props {
  listingId: string;
  target: 'ACTIVE' | 'PAUSED' | 'CLOSED';
}

const COPY: Record<Props['target'], { label: string; cta: string; variant: 'default' | 'destructive' | 'outline' }> = {
  ACTIVE: {
    label: 'Optional note (shows in the publisher\'s notification)',
    cta: 'Reactivate listing',
    variant: 'default',
  },
  PAUSED: {
    label: 'Reason (required ≥5 chars — publisher will see this)',
    cta: 'Pause listing',
    variant: 'outline',
  },
  CLOSED: {
    label: 'Reason (required ≥5 chars — publisher will see this)',
    cta: 'Close listing',
    variant: 'destructive',
  },
};

export function OverrideForm({ listingId, target }: Props) {
  const [state, action] = useFormState(overrideListing, initialState);
  const copy = COPY[target];

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="target" value={target} />

      <label className="flex flex-col gap-1.5">
        <span className="text-caption uppercase text-tertiary">{copy.label}</span>
        <textarea
          name="reason"
          rows={4}
          placeholder={
            target === 'ACTIVE'
              ? 'e.g. "Issues resolved — back to active."'
              : 'e.g. "Content violates the audience-targeting policy."'
          }
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

      <div>
        <SubmitButton variant={copy.variant} pendingLabel="Saving…">
          {copy.cta}
        </SubmitButton>
      </div>
    </form>
  );
}
