'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';

import { SubmitButton } from '@/components/ui/submit-button';

import { saveContent, saveSlaHours, type SettingState } from './_actions';

const initialState: SettingState = { ok: true };

export function SlaForm({ currentHours }: { currentHours: number }) {
  const [state, action] = useFormState(saveSlaHours, initialState);
  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5"
    >
      <h2 className="text-h3 text-primary">SLA hours</h2>
      <p className="text-body text-secondary">
        How long the platform team has to send the first reply on a new inquiry
        before the SLA clock turns red. Applies to inquiries created from this
        save onward.
      </p>
      <div className="flex items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Hours (1–168)</span>
          <input
            type="number"
            name="hours"
            min={1}
            max={168}
            defaultValue={currentHours}
            required
            className="w-32 rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </label>
        <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
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

interface ContentDefaults {
  slug: 'terms' | 'privacy' | 'faq';
  title: string;
  body: string;
}

export function ContentForm({ defaults }: { defaults: ContentDefaults }) {
  const [state, action] = useFormState(saveContent, initialState);
  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5"
    >
      <input type="hidden" name="slug" value={defaults.slug} />
      <h3 className="text-h3 text-primary">/{defaults.slug}</h3>
      <label className="flex flex-col gap-1">
        <span className="text-caption uppercase text-tertiary">Page title</span>
        <input
          type="text"
          name="title"
          defaultValue={defaults.title}
          maxLength={200}
          required
          className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-caption uppercase text-tertiary">
          Body (plain text — blank line = paragraph break)
        </span>
        <textarea
          name="body"
          rows={12}
          defaultValue={defaults.body}
          minLength={20}
          maxLength={20000}
          required
          className="rounded border border-border-subtle bg-background px-3 py-2 font-mono text-caption text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
      </label>
      <div className="flex items-center gap-3">
        <SubmitButton pendingLabel="Saving…">Save /{defaults.slug}</SubmitButton>
        {state.formError ? (
          <p
            role="alert"
            className="text-caption text-danger"
          >
            {state.formError}
          </p>
        ) : null}
        {state.ok && state.successFlash ? (
          <p className="text-caption text-success">{state.successFlash}</p>
        ) : null}
      </div>
    </form>
  );
}
