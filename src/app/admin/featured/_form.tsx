'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';

import { SubmitButton } from '@/components/ui/submit-button';

import { addFeatured, type FeaturedFormState } from './_actions';

const initialState: FeaturedFormState = { ok: true };

interface Props {
  listings: Array<{ id: string; label: string }>;
}

export function AddFeaturedForm({ listings }: Props) {
  const [state, action] = useFormState(addFeatured, initialState);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.ok && state.successFlash) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5"
    >
      <h2 className="text-h3 text-primary">Feature a listing</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <label className="md:col-span-2 flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Listing</span>
          <select
            name="listingId"
            required
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          >
            <option value="">Pick an active listing…</option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Position</span>
          <input
            type="number"
            name="position"
            min={0}
            max={999}
            defaultValue={0}
            required
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </label>
        <div className="flex items-end">
          <SubmitButton pendingLabel="Adding…">Feature</SubmitButton>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Starts (optional)</span>
          <input
            type="datetime-local"
            name="startsAt"
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Ends (optional)</span>
          <input
            type="datetime-local"
            name="endsAt"
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </label>
      </div>
      {state.formError ? (
        <p
          role="alert"
          className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-caption text-danger"
        >
          {state.formError}
        </p>
      ) : null}
      {state.ok && state.successFlash ? (
        <p className="rounded border border-success/30 bg-success/10 px-3 py-2 text-caption text-success">
          {state.successFlash}
        </p>
      ) : null}
    </form>
  );
}
