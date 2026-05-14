'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { bulkAssignInquiries } from './_bulk-actions';

interface Props {
  admins: Array<{ id: string; name: string }>;
  children: React.ReactNode;
}

/**
 * Wraps the queue's <table> in a <form> and tracks how many `inquiryIds`
 * checkboxes are checked via delegated change events on the form. The
 * floating action bar appears when at least one row is selected.
 *
 * State is intentionally derived from DOM (form.querySelectorAll('...:checked')),
 * not from React. Selection lives only in the markup of the checkboxes — the
 * server-rendered table can repaint freely without us re-syncing React state.
 */
export function BulkForm({ admins, children }: Props) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [count, setCount] = React.useState(0);
  const [adminId, setAdminId] = React.useState('');

  const recount = React.useCallback(() => {
    const form = formRef.current;
    if (!form) return;
    setCount(
      form.querySelectorAll<HTMLInputElement>(
        'input[name="inquiryIds"]:checked'
      ).length
    );
  }, []);

  React.useEffect(() => {
    recount();
    // Wire up the header select-all checkbox if the table rendered one.
    const form = formRef.current;
    if (!form) return;
    const selectAll = form.querySelector<HTMLInputElement>('input[data-select-all]');
    if (!selectAll) return;
    const onAll = () => {
      form
        .querySelectorAll<HTMLInputElement>('input[name="inquiryIds"]')
        .forEach((cb) => {
          cb.checked = selectAll.checked;
        });
      recount();
    };
    selectAll.addEventListener('change', onAll);
    return () => selectAll.removeEventListener('change', onAll);
  }, [recount]);

  function selectedIds(): string[] {
    const form = formRef.current;
    if (!form) return [];
    return Array.from(
      form.querySelectorAll<HTMLInputElement>('input[name="inquiryIds"]:checked')
    ).map((cb) => cb.value);
  }

  function gotoClose(target: 'confirmed' | 'lost' | 'cancelled') {
    const ids = selectedIds();
    if (!ids.length) return;
    router.push(
      `/admin/inquiries/bulk-close?as=${target}&ids=${encodeURIComponent(ids.join(','))}`
    );
  }

  return (
    <form
      ref={formRef}
      action={bulkAssignInquiries}
      onChange={recount}
      className="relative"
    >
      {children}

      {count > 0 ? (
        <div className="sticky bottom-4 z-10 mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-accent/40 bg-surface-elevated p-3 shadow-lg shadow-black/20">
          <span className="text-body text-primary">
            {count} selected
          </span>

          <div className="flex items-center gap-2">
            <label className="text-caption uppercase text-tertiary">Assign to</label>
            <select
              name="targetAdminId"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              className="rounded border border-border-subtle bg-background px-2 py-1 text-caption text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
            >
              <option value="">Pick…</option>
              <option value="unassigned">Unassigned</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!adminId}
              className="inline-flex h-8 items-center rounded bg-accent px-3 text-caption font-medium text-accent-on transition hover:bg-accent/90 disabled:opacity-40"
            >
              Apply
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-caption uppercase text-tertiary">Close as</span>
            <button
              type="button"
              onClick={() => gotoClose('confirmed')}
              className="inline-flex h-8 items-center rounded border border-success/40 bg-success/10 px-3 text-caption font-medium text-success transition hover:bg-success/20"
            >
              Confirmed
            </button>
            <button
              type="button"
              onClick={() => gotoClose('lost')}
              className="inline-flex h-8 items-center rounded border border-danger/40 bg-danger/10 px-3 text-caption font-medium text-danger transition hover:bg-danger/20"
            >
              Lost
            </button>
            <button
              type="button"
              onClick={() => gotoClose('cancelled')}
              className="inline-flex h-8 items-center rounded border border-border-strong bg-background px-3 text-caption font-medium text-secondary transition hover:text-primary"
            >
              Cancelled
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
