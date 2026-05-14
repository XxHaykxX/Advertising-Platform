'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';

import { SubmitButton } from '@/components/ui/submit-button';

import { createIndustry, type IndustryFormState } from './_actions';

interface Props {
  parents: Array<{ id: string; name: string }>;
}

const initialState: IndustryFormState = { ok: true };

export function CreateIndustryForm({ parents }: Props) {
  const [rawState, action] = useFormState(createIndustry, initialState);
  const state = rawState ?? initialState;
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.ok && !state.formError) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5"
    >
      <h2 className="text-h3 text-primary">Add an industry</h2>
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Name</span>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. Fintech"
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary placeholder:text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Parent (optional)</span>
          <select
            name="parentId"
            defaultValue=""
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          >
            <option value="">— Top level —</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <SubmitButton pendingLabel="Adding…">Add</SubmitButton>
      </div>
      {state.formError ? (
        <p
          role="alert"
          className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-caption text-danger"
        >
          {state.formError}
        </p>
      ) : null}
    </form>
  );
}
