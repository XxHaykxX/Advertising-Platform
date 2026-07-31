"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { restoreDeleted, restoreVersion, type HistoryActionResult } from "./actions";

/** Shared plumbing for both restore buttons below: a confirm dialog, a
 *  pending state, and the ok/redirect/error handling every Server Action in
 *  this app follows (see AGENTS.md — never redirect() from the action
 *  itself). No redirect means the underlying record didn't move, so a plain
 *  router.refresh() is enough to show the result in place. */
function useRestoreDialog(run: () => Promise<HistoryActionResult>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  function confirm() {
    start(async () => {
      setError("");
      const result = await run();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      if (result.redirect) window.location.assign(result.redirect);
      else router.refresh();
    });
  }

  return { open, setOpen, pending, error, confirm };
}

/** "Restore this version" — rolls one record back to an earlier save.
 *  Rendered only for SUPERADMIN by the caller; restoreVersion() re-checks
 *  that itself too. */
export function RestoreVersionButton({
  entity,
  entityId,
  version,
}: {
  entity: string;
  entityId: number;
  version: number;
}) {
  const { open, setOpen, pending, error, confirm } = useRestoreDialog(() => restoreVersion(entity, entityId, version));

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Restore
      </button>
      <ConfirmDialog
        open={open}
        title="Restore this version?"
        message="The record will be replaced with the state it had at this point in time."
        confirmLabel="Restore"
        danger={false}
        pending={pending}
        onCancel={() => !pending && setOpen(false)}
        onConfirm={confirm}
      />
      {error ? <p className="mt-1 max-w-[16rem] text-xs text-danger">{error}</p> : null}
    </div>
  );
}

/** "Restore" in the trash view — recreates a deleted record from its last
 *  known state. Rendered only for SUPERADMIN by the caller. */
export function RestoreDeletedButton({ entity, entityId }: { entity: string; entityId: number }) {
  const { open, setOpen, pending, error, confirm } = useRestoreDialog(() => restoreDeleted(entity, entityId));

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
        Restore
      </button>
      <ConfirmDialog
        open={open}
        title="Restore this record?"
        message="It will be recreated from the last state it had before deletion."
        confirmLabel="Restore"
        danger={false}
        pending={pending}
        onCancel={() => !pending && setOpen(false)}
        onConfirm={confirm}
      />
      {error ? <p className="mt-1 max-w-[16rem] text-xs text-danger">{error}</p> : null}
    </div>
  );
}
