"use client";

import { useState } from "react";
import type { ReactNode } from "react";

/** Staff / Members tab switcher for the Users admin page. Each tab's table
   is rendered server-side (including its RowActions client islands) and
   handed in as a prop — this component only owns the active-tab state, no
   data fetching here. */
export function UsersTabs({
  staffTab,
  membersTab,
}: {
  staffTab: ReactNode;
  membersTab: ReactNode;
}) {
  const [tab, setTab] = useState<"staff" | "members">("staff");

  return (
    <div>
      <div className="mt-4 flex gap-1 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("staff")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "staff"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Staff
        </button>
        <button
          type="button"
          onClick={() => setTab("members")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "members"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Members
        </button>
      </div>
      <div className="mt-6">{tab === "staff" ? staffTab : membersTab}</div>
    </div>
  );
}
