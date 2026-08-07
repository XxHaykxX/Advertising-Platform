"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/container";

/** The project form is the same ~40-field component the admin panel uses
 *  (project-form.tsx, mode="creator"), and the admin renders it on a full-width
 *  working area with no max-width cap (admin-shell.tsx). The cabinet used to
 *  render it inside the 1200px Container *plus* a 240px sidebar, and the form's
 *  own 320px meta column takes the rest — leaving ~540px for the column that
 *  carries the synopsis, the cast rows and the offer cards. Owner's verdict:
 *  "unusable".
 *
 *  So the two form routes drop the sidebar and widen out. 1600px rather than
 *  edge-to-edge: past that the synopsis textarea turns into an unreadable
 *  2200px line on a 2560px monitor (owner decision 2026-08-07).
 *
 *  Client component only for usePathname — the sidebar itself arrives as a
 *  ready-made element from the server layout, so none of its code lands in this
 *  bundle. */
const WIDE_ROUTE = /^\/account\/projects\/(new|\d+\/edit)$/;

export function CreatorShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (WIDE_ROUTE.test(pathname)) {
    return (
      // overflow-x-clip, not -hidden: the form's sticky save bar would stop
      // sticking inside a scroll container (same reason admin-shell.tsx uses it).
      <div className="flex-1">
        <main className="mx-auto min-w-0 max-w-[1600px] overflow-x-clip px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <Container className="py-10">
        <div className="flex flex-col gap-8 lg:flex-row">
          {sidebar}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </Container>
    </div>
  );
}
