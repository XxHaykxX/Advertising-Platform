import "server-only";

// In-memory per-user daily quota for the PAID poster generator. It exists to
// stop a member (or staffer) burning the paid Google image API by hammering the
// "Generate" / "Regenerate" button — the goal is a hard cost ceiling, not exact
// accounting. Counts every *attempt* (that's what costs money), resets at UTC
// midnight, and is per-process (Hostinger runs a single long-lived Node
// process, so one Map is enough; it also resets on restart, which only ever
// makes the limit more generous). Override the ceiling with POSTER_DAILY_LIMIT.
const DEFAULT_DAILY_LIMIT = 10;

const hits = new Map<string, { day: string; count: number }>();

function today(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC
}

/** Records one generation attempt for `userId` and reports whether it's allowed.
 *  Call this right before the paid API call, once per attempt. */
export function checkPosterQuota(userId: string): { ok: boolean; remaining: number } {
  const limit = Number(process.env.POSTER_DAILY_LIMIT) || DEFAULT_DAILY_LIMIT;
  const day = today();
  const cur = hits.get(userId);
  const count = cur && cur.day === day ? cur.count : 0;
  if (count >= limit) return { ok: false, remaining: 0 };
  hits.set(userId, { day, count: count + 1 });
  return { ok: true, remaining: limit - count - 1 };
}
