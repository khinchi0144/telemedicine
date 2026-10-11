import 'server-only';

import { Errors } from './errors';

interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * In-process sliding window rate limiter.
 *
 * Protects the sensitive auth endpoints. In a multi-instance deployment this
 * must be replaced by a shared store (Redis) — the interface is intentionally
 * small so the swap stays local to this file.
 */
const buckets = new Map<string, Bucket>();

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  if (buckets.size > 5000) sweep(now);

  const bucketKey = `${key}:${Math.floor(now / windowMs)}`;
  const existing = buckets.get(bucketKey);

  if (!existing) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      success: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    success: true,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: 0,
  };
}

export function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  message?: string,
) {
  const result = rateLimit(key, limit, windowMs);
  if (!result.success) {
    throw Errors.rateLimited(
      message ??
        `Too many attempts. Please try again in ${result.retryAfterSeconds} seconds.`,
    );
  }
  return result;
}

/** Rate limit key for an action performed by a client (falls back to IP). */
export function clientKey(request: Request, scope: string, extra?: string) {
  const forwarded = request.headers.get('x-forwarded-for') ?? '';
  const ip = forwarded.split(',')[0]?.trim() || 'local';
  return [scope, ip, extra].filter(Boolean).join(':');
}
