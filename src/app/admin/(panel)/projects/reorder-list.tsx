"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, GripVertical, Loader2 } from "lucide-react";
import { ActiveToggle, DeleteButton } from "./row-actions";
import { reorderProjects } from "./actions";

export type ReorderRow = {
  id: number;
  poster: string | null;
  title: string;
  code: string;
  statusLabel: string;
  isActive: boolean;
  ownerName: string;
};

// SUPERADMIN-only global catalog ordering (T2). Rows are draggable (native
// HTML5 drag-and-drop, no extra dependency — this repo doesn't already ship a
// DnD lib) and, for keyboard/accessible use, movable with the ↑/↓ buttons.
// Both paths funnel through move(), which reorders locally (optimistic) then
// persists the whole sequence via reorderProjects — see actions.ts for why
// this is superadmin-only.
export function ReorderableProjectsTable({ projects }: { projects: ReorderRow[] }) {
  const [rows, setRows] = useState(projects);
  const [pending, startTransition] = useTransition();
  // Transient "Saved" confirmation, same pattern as profile-form.tsx (IA-28).
  const [showSaved, setShowSaved] = useState(false);
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragIndex = useRef<number | null>(null);

  function persist(next: ReorderRow[]) {
    setShowSaved(false);
    startTransition(async () => {
      await reorderProjects(next.map((p) => p.id));
      setShowSaved(true);
      if (savedTimeout.current) clearTimeout(savedTimeout.current);
      savedTimeout.current = setTimeout(() => setShowSaved(false), 2500);
    });
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= rows.length || from === to) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setRows(next);
    persist(next);
  }

  return (
    <div>
      <div className="mb-2 flex h-5 items-center gap-2 text-sm">
        {pending && (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving order…
          </span>
        )}
        {showSaved && !pending && <span className="font-medium text-success">Order saved</span>}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="w-10 px-2 py-3"></th>
              <th className="px-4 py-3 font-medium">Poster</th>
              <th className="px-4 py-3 font-medium">Title / Code</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr
                key={p.id}
                draggable
                onDragStart={() => {
                  dragIndex.current = i;
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  const from = dragIndex.current;
                  dragIndex.current = null;
                  if (from !== null) move(from, i);
                }}
                className="border-b border-border last:border-b-0 hover:bg-muted/50"
              >
                <td className="px-2 py-3">
                  <div className="flex items-center gap-0.5">
                    <span className="cursor-grab text-muted-foreground active:cursor-grabbing" aria-hidden>
                      <GripVertical className="h-4 w-4" />
                    </span>
                    <div className="flex flex-col">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => move(i, i - 1)}
                        className="grid h-4 w-4 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                        aria-label={`Move ${p.title} up`}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        disabled={i === rows.length - 1}
                        onClick={() => move(i, i + 1)}
                        className="grid h-4 w-4 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                        aria-label={`Move ${p.title} down`}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="h-10 w-16 overflow-hidden rounded bg-muted">
                    {p.poster && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.poster} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/projects/${p.id}/edit`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {p.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">{p.code}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.statusLabel}</td>
                <td className="px-4 py-3">
                  <ActiveToggle id={p.id} active={p.isActive} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.ownerName}</td>
                <td className="px-4 py-3">
                  <DeleteButton id={p.id} title={p.title} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
