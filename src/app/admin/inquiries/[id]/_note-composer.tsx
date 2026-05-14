'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';

import { SubmitButton } from '@/components/ui/submit-button';

import { addInternalNote, type NoteState } from './_notes-actions';

const initialState: NoteState = { ok: true };

export function NoteComposer({ inquiryId }: { inquiryId: string }) {
  const [rawState, action] = useFormState(addInternalNote, initialState);
  const state = rawState ?? initialState;
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.ok && !state.formError) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2">
      <input type="hidden" name="inquiryId" value={inquiryId} />
      <textarea
        name="body"
        rows={2}
        placeholder="Add an internal note. Visible only to admins."
        className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary placeholder:text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
      />
      {state.formError ? (
        <p
          role="alert"
          className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-caption text-danger"
        >
          {state.formError}
        </p>
      ) : null}
      <div className="flex justify-end">
        <SubmitButton size="sm" pendingLabel="Saving…">
          Post note
        </SubmitButton>
      </div>
    </form>
  );
}
