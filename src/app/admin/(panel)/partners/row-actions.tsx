"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { deletePartner } from "./actions";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function DeleteButton({ id, name }: { id: number; name: string }) {
  const [pending, start] = useTransition();
  // The browser's confirm() is an OS box with none of the app's design; the
  // styled dialog already existed and is used elsewhere for deletions.
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/admin/partners/${id}/edit`}
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
        title={`Delete partner “${name}”?`}
        message="This cannot be undone."
        confirmLabel="Delete"
        pending={pending}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          start(async () => {
            await deletePartner(id);
            setConfirming(false);
          })
        }
      />
    </div>
  );
}
