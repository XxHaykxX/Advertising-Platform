'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';

import { SubmitButton } from '@/components/ui/submit-button';

import {
  submitVerificationRequest,
  type SubmitVerificationActionState,
} from './_actions';

const initialState: SubmitVerificationActionState = { ok: true };

export function VerificationForm() {
  const [rawState, action] = useFormState(submitVerificationRequest, initialState);
  const state = rawState ?? initialState;
  const [count, setCount] = React.useState(0);

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.formError ? (
        <p className="rounded border border-danger/30 bg-danger/10 p-3 text-body text-danger">
          {state.formError}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="documents"
          className="mb-1.5 block text-caption uppercase text-tertiary"
        >
          Supporting documents
        </label>
        <input
          id="documents"
          name="documents"
          type="file"
          multiple
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={(e) => setCount(e.target.files?.length ?? 0)}
          className="block w-full text-body text-primary file:mr-4 file:rounded file:border-0 file:bg-surface-elevated file:px-3 file:py-2 file:text-body file:font-medium file:text-primary hover:file:bg-border-subtle"
        />
        <p className="mt-2 text-caption text-tertiary">
          Up to 5 files · PDF, JPG, PNG, WEBP · 10 MB each. Optional but speeds up
          review.
        </p>
        {count > 0 ? (
          <p className="mt-1 text-caption text-secondary">
            {count} file{count === 1 ? '' : 's'} selected.
          </p>
        ) : null}
      </div>

      <SubmitButton size="lg" pendingLabel="Submitting…" className="w-full">
        Submit for verification
      </SubmitButton>
    </form>
  );
}
