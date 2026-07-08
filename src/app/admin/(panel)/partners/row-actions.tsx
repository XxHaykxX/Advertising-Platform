"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { deletePartner } from "./actions";

export function DeleteButton({ id, name }: { id: number; name: string }) {
  const [pending, start] = useTransition();
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
        onClick={() => {
          if (confirm(`Delete partner "${name}"? This cannot be undone.`)) {
            start(() => deletePartner(id));
          }
        }}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
        aria-label="Delete"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
