// Liveness probe for the ALB target group (AWS migration).
//
// Deliberately does NOT touch the database. A health check that queries Prisma
// turns a brief RDS hiccup into "every task fails its check, ECS drains them
// all, nothing is left to serve even an error page" — the outage gets bigger
// rather than smaller. What this answers is the only question the load balancer
// is actually asking: is this container up and accepting HTTP?
//
// Outside the proxy matcher (src/proxy.ts excludes /api), so no auth or locale
// work runs for it either.
export const dynamic = "force-dynamic";

export function GET() {
  return new Response("ok", {
    status: 200,
    headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
  });
}
