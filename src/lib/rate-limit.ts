// In-memory token bucket for per-IP rate limiting.
// Architecture ADR-007: no Redis on Hostinger — single-process state is sufficient
// for MVP. State resets on process restart, which is acceptable for auth-flow
// flood protection.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitParams {
  /** Logical bucket key — combine purpose + IP, e.g. "login:1.2.3.4". */
  key: string;
  /** Maximum hits allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function consumeRateLimit({
  key,
  limit,
  windowMs,
}: RateLimitParams): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: limit - bucket.count,
    retryAfterSeconds: 0,
  };
}

// Reset a bucket on success — e.g. clear failed-login counter after a good login.
export function resetRateLimit(key: string) {
  buckets.delete(key);
}
