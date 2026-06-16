"use client";

import { useTransition } from "react";
import { APP_STATUSES, STATUS_LABEL, STATUS_STYLE, type AppStatus } from "@/lib/constants";
import { setStatus } from "./actions";

export function StatusSelect({
  id,
  status,
}: {
  id: number;
  status: AppStatus;
}) {
  const [pending, start] = useTransition();

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        start(() => setStatus(id, next));
      }}
      onClick={(e) => e.stopPropagation()}
      className={`rounded-full border px-2.5 py-1 text-xs font-medium outline-none transition-colors ${STATUS_STYLE[status]} ${pending ? "opacity-60" : ""}`}
    >
      {APP_STATUSES.map((s) => (
        <option key={s} value={s} className="bg-[#141414] text-white">
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
