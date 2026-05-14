'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';

import { SubmitButton } from '@/components/ui/submit-button';

import {
  createAnnouncement,
  type AnnouncementFormState,
} from './_actions';

const initialState: AnnouncementFormState = { ok: true };

function defaultStarts(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultEnds(): string {
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AnnouncementForm() {
  const [state, action] = useFormState(createAnnouncement, initialState);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.ok && state.successFlash) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5"
    >
      <h2 className="text-h3 text-primary">New announcement</h2>

      <label className="flex flex-col gap-1">
        <span className="text-caption uppercase text-tertiary">Title</span>
        <input
          type="text"
          name="title"
          required
          maxLength={200}
          placeholder="Planned maintenance window — May 21"
          className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary placeholder:text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
        {state.fieldErrors?.title ? (
          <p className="text-caption text-danger">{state.fieldErrors.title}</p>
        ) : null}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-caption uppercase text-tertiary">Body</span>
        <textarea
          name="body"
          rows={3}
          required
          maxLength={3000}
          placeholder="What people need to know."
          className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary placeholder:text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
        {state.fieldErrors?.body ? (
          <p className="text-caption text-danger">{state.fieldErrors.body}</p>
        ) : null}
      </label>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Audience</span>
          <select
            name="audience"
            defaultValue="ALL"
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          >
            <option value="ALL">Everyone</option>
            <option value="ADVERTISERS">Advertisers only</option>
            <option value="PUBLISHERS">Publishers only</option>
            <option value="ADMINS">Admins only</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Starts</span>
          <input
            type="datetime-local"
            name="startsAt"
            defaultValue={defaultStarts()}
            required
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Ends</span>
          <input
            type="datetime-local"
            name="endsAt"
            defaultValue={defaultEnds()}
            required
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
          {state.fieldErrors?.endsAt ? (
            <p className="text-caption text-danger">{state.fieldErrors.endsAt}</p>
          ) : null}
        </label>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton pendingLabel="Saving…">Publish</SubmitButton>
        {state.ok && state.successFlash ? (
          <p className="text-caption text-success">{state.successFlash}</p>
        ) : null}
        {state.formError ? (
          <p className="text-caption text-danger">{state.formError}</p>
        ) : null}
      </div>
    </form>
  );
}
