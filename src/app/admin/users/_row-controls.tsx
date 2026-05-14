'use client';

import * as React from 'react';

import { sendPasswordReset, suspendUser, unsuspendUser } from './_actions';

interface Props {
  userId: string;
  role: 'ADVERTISER' | 'PUBLISHER' | 'ADMIN';
  suspended: boolean;
  isSelf: boolean;
}

export function UserRowControls({ userId, role, suspended, isSelf }: Props) {
  const [askingReason, setAskingReason] = React.useState(false);

  // Admins are managed on /admin/team — no row actions here.
  if (role === 'ADMIN' || isSelf) {
    return <span className="text-caption text-tertiary">—</span>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        {suspended ? (
          <form action={unsuspendUser}>
            <input type="hidden" name="userId" value={userId} />
            <button
              type="submit"
              className="text-caption text-success underline-offset-4 hover:underline"
            >
              Unsuspend
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAskingReason((v) => !v)}
            className="text-caption text-warning underline-offset-4 hover:underline"
          >
            Suspend
          </button>
        )}
        <form action={sendPasswordReset}>
          <input type="hidden" name="userId" value={userId} />
          <button
            type="submit"
            className="text-caption text-secondary underline-offset-4 hover:text-primary hover:underline"
          >
            Send password reset
          </button>
        </form>
      </div>
      {askingReason && !suspended ? (
        <form action={suspendUser} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="userId" value={userId} />
          <input
            type="text"
            name="reason"
            placeholder="Reason (≥5 chars — shown to user)"
            minLength={5}
            maxLength={2000}
            required
            className="flex-1 min-w-[220px] rounded border border-border-subtle bg-background px-2 py-1 text-caption text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
          <button
            type="submit"
            className="rounded border border-warning/40 bg-warning/10 px-3 py-1 text-caption text-warning hover:bg-warning/20"
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={() => setAskingReason(false)}
            className="text-caption text-tertiary underline-offset-4 hover:underline"
          >
            Cancel
          </button>
        </form>
      ) : null}
    </div>
  );
}
