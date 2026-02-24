/**
 * In-memory sliding-window rate limiter.
 * Suitable for single-instance deployments. For multi-instance,
 * swap the Map storage for Postgres/Redis.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean old entries every 5 minutes to prevent memory bloat
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds (default: 60000 = 1 minute) */
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Check if a request is allowed under the rate limit.
 * @param identifier - Unique key (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const { maxRequests, windowMs = 60_000 } = config;
  const now = Date.now();
  const cutoff = now - windowMs;

  // Periodic cleanup
  cleanup(windowMs);

  let entry = store.get(identifier);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(identifier, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const resetMs = oldestInWindow + windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(resetMs, 0),
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    resetMs: windowMs,
  };
}

/**
 * Helper to extract client IP from request headers.
 */
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

/**
 * Create a rate-limited Response (429).
 */
export function rateLimitResponse(resetMs: number): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      retryAfterMs: resetMs,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil(resetMs / 1000)),
      },
    }
  );
}
