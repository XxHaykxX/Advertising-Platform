'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';

import { SubmitButton } from '@/components/ui/submit-button';

import { createAdminUser, type CreateAdminState } from './_actions';

const initialState: CreateAdminState = { ok: true };

export function CreateAdminForm() {
  const [state, action] = useFormState(createAdminUser, initialState);
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
      <h2 className="text-h3 text-primary">Invite a new admin</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Email</span>
          <input
            type="email"
            name="email"
            required
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary placeholder:text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
          {state.fieldErrors?.email ? (
            <p className="text-caption text-danger">{state.fieldErrors.email}</p>
          ) : null}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Name</span>
          <input
            type="text"
            name="name"
            required
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary placeholder:text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
          {state.fieldErrors?.name ? (
            <p className="text-caption text-danger">{state.fieldErrors.name}</p>
          ) : null}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Initial password</span>
          <input
            type="password"
            name="password"
            required
            minLength={10}
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary placeholder:text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
          {state.fieldErrors?.password ? (
            <p className="text-caption text-danger">{state.fieldErrors.password}</p>
          ) : null}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Sub-role</span>
          <select
            name="subrole"
            defaultValue="MANAGER"
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          >
            <option value="OWNER">Owner</option>
            <option value="MANAGER">Manager</option>
            <option value="BROKER">Broker</option>
            <option value="SUPPORT">Support</option>
          </select>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton pendingLabel="Inviting…">Invite admin</SubmitButton>
        <p className="text-caption text-tertiary">
          They sign in with the password you set; first login forces TOTP enrolment.
        </p>
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
