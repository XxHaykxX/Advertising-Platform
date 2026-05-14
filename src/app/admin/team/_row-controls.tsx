'use client';

import * as React from 'react';

import {
  changeAdminSubrole,
  resetAdminMfaState,
  resetAdminPassword,
} from './_actions';

interface Props {
  userId: string;
  currentSubrole: 'OWNER' | 'MANAGER' | 'BROKER' | 'SUPPORT' | null;
  isSelf: boolean;
}

export function AdminRowControls({ userId, currentSubrole, isSelf }: Props) {
  const [showReset, setShowReset] = React.useState(false);
  const [resetError, setResetError] = React.useState<string | null>(null);

  async function onResetPassword(formData: FormData) {
    setResetError(null);
    const result = await resetAdminPassword(formData);
    if (!result.ok) {
      setResetError(result.formError ?? 'Could not reset password.');
    } else {
      setShowReset(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        {/* Sub-role select. Auto-submits on change. */}
        <form action={changeAdminSubrole} className="flex items-center gap-2">
          <input type="hidden" name="userId" value={userId} />
          <select
            name="subrole"
            defaultValue={currentSubrole ?? 'MANAGER'}
            disabled={isSelf}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="rounded border border-border-subtle bg-background px-2 py-1 text-caption text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40 disabled:opacity-50"
          >
            <option value="OWNER">Owner</option>
            <option value="MANAGER">Manager</option>
            <option value="BROKER">Broker</option>
            <option value="SUPPORT">Support</option>
          </select>
        </form>

        <form action={resetAdminMfaState}>
          <input type="hidden" name="userId" value={userId} />
          <button
            type="submit"
            disabled={isSelf}
            className="text-caption text-secondary underline-offset-4 hover:text-primary hover:underline disabled:opacity-50 disabled:hover:text-secondary disabled:hover:no-underline"
            title={isSelf ? 'Reset your own 2FA via /admin/2fa-setup' : 'Clear TOTP enrolment'}
          >
            Reset 2FA
          </button>
        </form>

        <button
          type="button"
          disabled={isSelf}
          onClick={() => setShowReset((v) => !v)}
          className="text-caption text-secondary underline-offset-4 hover:text-primary hover:underline disabled:opacity-50"
        >
          Reset password
        </button>
      </div>

      {showReset && !isSelf ? (
        <form action={onResetPassword} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="userId" value={userId} />
          <input
            type="password"
            name="password"
            placeholder="New password (≥10 chars)"
            minLength={10}
            required
            className="rounded border border-border-subtle bg-background px-2 py-1 text-caption text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
          <button
            type="submit"
            className="rounded bg-accent px-3 py-1 text-caption font-medium text-accent-on hover:bg-accent/90"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setShowReset(false)}
            className="text-caption text-tertiary underline-offset-4 hover:underline"
          >
            Cancel
          </button>
          {resetError ? <p className="text-caption text-danger">{resetError}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
