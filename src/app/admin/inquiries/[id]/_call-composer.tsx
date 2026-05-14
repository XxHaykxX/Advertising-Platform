'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';

import { SubmitButton } from '@/components/ui/submit-button';

import { logCall, type CallState } from './_calls-actions';

const initialState: CallState = { ok: true };

function nowForDatetimeLocal(): string {
  // <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in local time.
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CallComposer({ inquiryId }: { inquiryId: string }) {
  const [state, action] = useFormState(logCall, initialState);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (state.ok && !state.formError) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-fit items-center rounded border border-border-strong px-3 py-1.5 text-caption text-secondary transition hover:border-accent/40 hover:text-primary"
      >
        📞 Log a call
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-col gap-3 rounded-lg border border-border-strong bg-background p-4"
    >
      <input type="hidden" name="inquiryId" value={inquiryId} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Side</span>
          <select
            name="side"
            defaultValue="ADVERTISER"
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          >
            <option value="ADVERTISER">Advertiser</option>
            <option value="PUBLISHER">Publisher</option>
            <option value="OTHER">Other / Internal</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">When</span>
          <input
            type="datetime-local"
            name="occurredAt"
            defaultValue={nowForDatetimeLocal()}
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Duration (min)</span>
          <input
            type="number"
            name="durationMinutes"
            min={1}
            max={600}
            defaultValue={15}
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-caption uppercase text-tertiary">Notes</span>
        <textarea
          name="notes"
          rows={3}
          placeholder="What was agreed, decided, blocked?"
          className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary placeholder:text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
      </label>

      {state.formError ? (
        <p
          role="alert"
          className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-caption text-danger"
        >
          {state.formError}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <SubmitButton pendingLabel="Logging…" size="sm">
          Log call
        </SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-caption text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
