"use client";

import { useState } from "react";
import type { ActorDTO as Actor } from "@/lib/types";

/* Round actor headshot. Shows the photo when present and loadable, otherwise a
   deterministic initials avatar so the layout never breaks before real photos
   are uploaded via the admin panel. */
export function ActorAvatar({
  actor,
  className = "h-16 w-16",
}: {
  actor: Actor;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = `${actor.firstName[0] ?? ""}${actor.lastName[0] ?? ""}`;

  if (actor.photo && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={actor.photo}
        alt={`${actor.firstName} ${actor.lastName}`}
        onError={() => setFailed(true)}
        className={`${className} shrink-0 rounded-full object-cover ring-1 ring-white/15`}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={`${className} grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/40 to-red-900/40 text-sm font-bold uppercase text-white ring-1 ring-white/15`}
    >
      {initials}
    </div>
  );
}
