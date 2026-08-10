"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteAdSpace } from "./actions";

/** Edit + delete for one ad-space row — the same pair (and the same styled
 *  confirm dialog instead of the browser's box) as portfolio/row-actions.tsx. */
export function RowActions({ id, title }: { id: number; title: string }) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/admin/ad-spaces/${id}/edit`}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Edit"
      >
        <Pencil className="h-4 w-4" />
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirming(true)}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-danger"
        aria-label="Delete"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>

      <ConfirmDialog
        open={confirming}
        title={`Delete ad space “${title}”?`}
        message="Its offers go with it. This cannot be undone."
        confirmLabel="Delete"
        pending={pending}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          start(async () => {
            await deleteAdSpace(id);
            setConfirming(false);
          })
        }
      />
    </div>
  );
}
