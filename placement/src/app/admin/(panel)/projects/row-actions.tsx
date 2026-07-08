"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { deleteProject, toggleActive } from "./actions";

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
        disabled={pending}
        onClick={() => {
          if (confirm(`Delete project "${title}"? This cannot be undone.`)) {
            start(() => deleteProject(id));
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
