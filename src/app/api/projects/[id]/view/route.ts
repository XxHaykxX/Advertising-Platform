/* View counter for a public report page (audit 4.8 — a creator had no numbers
   at all about their own listing).

   Why a route and not a server component: /reports/[id] is cached (tagged
   `projects`, revalidated on a window) and pre-rendered for known ids, so a
   counter incremented while rendering would count cache misses, not visitors.
   The page pings this endpoint from the client instead.

   Double-count protection is a per-visitor cookie holding the ids already
   counted today: a refresh loop, a back-button or a second tab adds nothing.
   It's deliberately cheap and approximate — this is a "how much interest is
   there" number for the creator, not analytics. */

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE = "igovazd_viewed";
const ONE_DAY_SECONDS = 60 * 60 * 24;

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return new Response(null, { status: 400 });
  }

  const jar = await cookies();
  const seen = (jar.get(COOKIE)?.value ?? "").split(",").filter(Boolean);
  if (seen.includes(String(projectId))) {
    return new Response(null, { status: 204 });
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { viewCount: { increment: 1 } },
    });
  } catch {
    // A view is never worth failing a request over (deleted project, DB blip).
    return new Response(null, { status: 204 });
  }

  // Keep the list short — the cookie travels on every request.
  const next = [...seen.slice(-40), String(projectId)].join(",");
  jar.set(COOKIE, next, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_DAY_SECONDS,
  });
  return new Response(null, { status: 204 });
}
