// Lightweight in-memory rate limiter.
//
// IMPORTANT: this only works correctly for a single Node.js process. If you
// deploy on a serverless/edge platform (Vercel, multiple containers, etc.)
// each instance has its own memory, so a determined attacker who gets
// load-balanced across instances effectively gets N× the limit. That's an
// acceptable trade-off for now, but if you deploy multi-instance, replace
// this with a shared store (Redis / Upstash) — the interface below is kept
// deliberately small so that swap is a one-file change.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodic cleanup so this Map doesn't grow forever on a long-running server.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Fixed-window rate limiter. Returns whether the request is allowed and
 * decrements the remaining count as a side effect (only when allowed).
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

// Best-effort client IP extraction behind a proxy/load balancer.
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}
