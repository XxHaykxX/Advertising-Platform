'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';

import { SubmitButton } from '@/components/ui/submit-button';

import { decideVerification, type DecisionState } from './_actions';

const initialState: DecisionState = { ok: true };

export function DecisionForm({ verificationRequestId }: { verificationRequestId: string }) {
  const [state, action] = useFormState(decideVerification, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="verificationRequestId" value={verificationRequestId} />

      <label className="flex flex-col gap-1.5">
        <span className="text-caption uppercase text-tertiary">
          Reason (required for Reject / Request More Info)
        </span>
        <textarea
          name="reason"
          rows={3}
          className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary placeholder:text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          placeholder="What's missing or wrong? Visible to the company in their email and dashboard."
        />
      </label>

      {state.formError ? (
        <p
          className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-body text-danger"
          role="alert"
        >
          {state.formError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <SubmitButton
          name="action"
          value="approve"
          pendingLabel="Approving…"
        >
          Approve
        </SubmitButton>
        <SubmitButton
          name="action"
          value="reject"
          variant="destructive"
          pendingLabel="Rejecting…"
        >
          Reject
        </SubmitButton>
        <SubmitButton
          name="action"
          value="needs_info"
          variant="outline"
          pendingLabel="Requesting…"
        >
          Request more info
        </SubmitButton>
      </div>
    </form>
  );
}
