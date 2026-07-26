"use client";

import { useEffect } from "react";

/** Fires the view counter for this project once per mount (audit 4.8). The
 *  endpoint itself is what actually de-duplicates — see
 *  src/app/api/projects/[id]/view/route.ts. Renders nothing and never blocks
 *  or reports: a failed ping just means one uncounted view. */
export function ViewPing({ projectId }: { projectId: number }) {
  useEffect(() => {
    // keepalive so the request survives an immediate navigation away.
    fetch(`/api/projects/${projectId}/view`, { method: "POST", keepalive: true }).catch(() => {});
  }, [projectId]);

  return null;
}
