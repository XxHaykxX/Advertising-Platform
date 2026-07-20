"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Pencil, Trash2, Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteProject, duplicateProject, toggleActive } from "./actions";

export function ActiveToggle({ id, active }: { id: number; active: boolean }) {
  const [on, setOn] = useState(active);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const next = !on;
        setOn(next);
        start(() => toggleActive(id, next));
      }}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-primary" : "bg-border"} ${pending ? "opacity-60" : ""}`}
      aria-label={on ? "Hide" : "Show"}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}

export function DeleteButton({ id, title }: { id: number; title: string }) {
  const [pending, start] = useTransition();
  const [duplicating, startDuplicate] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();
  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/admin/projects/${id}/edit`}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Edit"
      >
        <Pencil className="h-4 w-4" />
      </Link>
      <button
        type="button"
        disabled={duplicating}
        onClick={() => {
          // #20²: clone this project as a template and jump to the new copy's
          // edit page. The action returns { redirect } (never redirect()s
          // itself — the 2026-07-15 black-screen bugfix), so navigate here.
          startDuplicate(async () => {
            const res = await duplicateProject(id);
            if (res?.redirect) router.push(res.redirect);
            else if (res?.error) alert(res.error);
          });
        }}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Duplicate"
        title="Duplicate as template"
      >
        {duplicating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirmOpen(true)}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
        aria-label="Delete"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete “${title}”?`}
        message="The project and all its images, cast, links and texts are permanently deleted. This cannot be undone."
        confirmLabel="Delete"
        pending={pending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() =>
          start(async () => {
            await deleteProject(id);
            setConfirmOpen(false);
          })
        }
      />
    </div>
  );
}
