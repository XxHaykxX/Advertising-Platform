"use client";

import { useState, type ReactNode } from "react";
import { History as HistoryIcon, Pencil } from "lucide-react";

const tabCls = (active: boolean) =>
  `flex items-center gap-2 border-b-2 px-3 pb-3 text-sm font-medium transition-colors ${
    active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
  }`;

/** Wraps an entity's edit form with an "Edit" / "History" tab switch.
 *
 *  `children` (the form) stays mounted at all times — only its visibility is
 *  toggled with a CSS class, never removed from the tree — so flipping to
 *  History and back can never reset in-progress, unsaved input. That
 *  matters most for project-form.tsx, the heaviest form in the app, which
 *  already tracks unsaved state and warns on navigating away; this must not
 *  fight that. */
export function EntityEditTabs({ history, children }: { history: ReactNode; children: ReactNode }) {
  const [tab, setTab] = useState<"edit" | "history">("edit");

  return (
    <div>
      <div className="mb-6 flex gap-2 border-b border-border">
        <button type="button" onClick={() => setTab("edit")} className={tabCls(tab === "edit")}>
          <Pencil className="h-4 w-4" />
          Edit
        </button>
        <button type="button" onClick={() => setTab("history")} className={tabCls(tab === "history")}>
          <HistoryIcon className="h-4 w-4" />
          History
        </button>
      </div>

      <div className={tab === "edit" ? "" : "hidden"}>{children}</div>
      <div className={tab === "history" ? "" : "hidden"}>{history}</div>
    </div>
  );
}
